const Project = require('../models/Project');
const Task = require('../models/Task');


const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    let query = {};

    if (req.user.role !== 'admin') {
      query.$or = [{ createdBy: req.user._id }, { 'members.user': req.user._id }];
    }

    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: projects,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Access check
    if (req.user.role !== 'admin') {
      const isMember =
        project.createdBy._id.toString() === req.user._id.toString() ||
        project.members.some((m) => m.user._id.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, dueDate, members, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      status,
      priority,
      dueDate,
      tags,
      createdBy: req.user._id,
      members: members || [],
    });

    await project.populate('createdBy', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    // Emit real-time event
    req.app.get('io').emit('project_created', project);

    res.status(201).json({ success: true, message: 'Project created', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Only admin or creator can update
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar');

    req.app.get('io').to(`project_${req.params.id}`).emit('project_updated', updated);

    res.json({ success: true, message: 'Project updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    req.app.get('io').emit('project_deleted', { id: req.params.id });
    res.json({ success: true, message: 'Project and all associated tasks deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const alreadyMember = project.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User already a member' });

    project.members.push({ user: userId, role: role || 'developer' });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ success: true, message: 'Member added', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
    await project.save();

    res.json({ success: true, message: 'Member removed', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };

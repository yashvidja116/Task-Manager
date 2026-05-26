const Task = require('../models/Task');
const Project = require('../models/Project');


const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, assignedTo, project, search, overdue, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (req.user.role !== 'admin') {
      const memberProjects = await Project.find({
        $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const projectIds = memberProjects.map((p) => p._id);
      query.$or = [{ project: { $in: projectIds } }, { assignedTo: req.user._id }];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (project) query.project = project;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'completed' };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: tasks,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name members createdBy');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, project, assignedTo, dueDate, tags, estimatedHours } = req.body;

    // Verify project exists
    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

    const task = await Task.create({
      title, description, status, priority, project, assignedTo, dueDate, tags, estimatedHours,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name');

    // Real-time update
    req.app.get('io').to(`project_${project}`).emit('task_created', task);

    res.status(201).json({ success: true, message: 'Task created', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name');

    req.app.get('io').to(`project_${task.project}`).emit('task_updated', updated);

    res.json({ success: true, message: 'Task updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only admin, creator, or project creator can delete
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await task.deleteOne();
    req.app.get('io').to(`project_${task.project}`).emit('task_deleted', { id: req.params.id });

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email avatar').populate('project', 'name');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    req.app.get('io').to(`project_${task.project._id}`).emit('task_updated', task);

    res.json({ success: true, message: 'Status updated', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus };

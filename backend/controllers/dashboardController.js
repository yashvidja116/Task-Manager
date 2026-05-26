const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');


const getStats = async (req, res) => {
  try {
    const now = new Date();
    let taskQuery = {};
    let projectQuery = {};

    // Scope by role
    if (req.user.role !== 'admin') {
      const memberProjects = await Project.find({
        $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const projectIds = memberProjects.map((p) => p._id);
      taskQuery.project = { $in: projectIds };
      projectQuery._id = { $in: projectIds };
    }

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      totalProjects,
      activeProjects,
      totalUsers,
    ] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'completed' }),
      Task.countDocuments({ ...taskQuery, status: 'in-progress' }),
      Task.countDocuments({ ...taskQuery, status: 'todo' }),
      Task.countDocuments({ ...taskQuery, status: 'review' }),
      Task.countDocuments({ ...taskQuery, status: { $ne: 'completed' }, dueDate: { $lt: now } }),
      Project.countDocuments(projectQuery),
      Project.countDocuments({ ...projectQuery, status: 'active' }),
      req.user.role === 'admin' ? User.countDocuments() : Promise.resolve(null),
    ]);

    const priorityBreakdown = await Task.aggregate([
      { $match: taskQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const taskActivity = await Task.aggregate([
      { $match: { ...taskQuery, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const recentTasks = await Task.find(taskQuery)
      .populate('assignedTo', 'name avatar')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          review: reviewTasks,
          overdue: overdueTasks,
          pendingTotal: todoTasks + inProgressTasks + reviewTasks,
        },
        projects: { total: totalProjects, active: activeProjects },
        users: totalUsers,
        priorityBreakdown: priorityBreakdown.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {}),
        taskActivity,
        recentTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats };

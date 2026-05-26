const Comment = require('../models/Comment');


const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Comment.countDocuments({ task: req.params.taskId });
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: comments.reverse(),
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const createComment = async (req, res) => {
  try {
    const { content, task } = req.body;
    const comment = await Comment.create({ content, task, author: req.user._id });
    await comment.populate('author', 'name email avatar');

    req.app.get('io').to(`project_task_${task}`).emit('comment_added', comment);

    res.status(201).json({ success: true, message: 'Comment added', data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate('author', 'name email avatar');

    res.json({ success: true, message: 'Comment updated', data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment };

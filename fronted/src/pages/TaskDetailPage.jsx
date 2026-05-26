import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { taskAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon, EditIcon, TrashIcon, CalendarIcon, UserIcon,
  ClockIcon, TagIcon, SendIcon, MessageSquareIcon,
} from 'lucide-react';
import { getStatusColor, getPriorityColor, formatDate, isOverdue, STATUSES } from '../utils/helpers';
import TaskModal from '../components/tasks/TaskModal';
import { format } from 'date-fns';

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchTask = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        taskAPI.getOne(id),
        commentAPI.getByTask(id),
      ]);
      setTask(taskRes.data.data);
      setComments(commentsRes.data.data);
    } catch {
      toast.error('Task not found');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await taskAPI.updateStatus(id, status);
      setTask(res.data.data);
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentAPI.create({ content: commentText.trim(), task: id });
      setComments((prev) => [...prev, res.data.data]);
      setCommentText('');
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmitting(false); }
  };

  const handleEditComment = async (commentId) => {
    try {
      const res = await commentAPI.update(commentId, { content: editText });
      setComments((prev) => prev.map((c) => c._id === commentId ? res.data.data : c));
      setEditingComment(null);
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentAPI.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch { toast.error('Failed to delete comment'); }
  };

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  );

  if (!task) return null;

  const overdue = isOverdue(task.dueDate, task.status);
  const canEdit = isAdmin || task.createdBy?._id === user._id || task.assignedTo?._id === user._id;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link to="/tasks" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Tasks
        </Link>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEditModal(true)} className="btn-secondary">
              <EditIcon className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleDelete} className="btn-danger">
              <TrashIcon className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task info */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`badge ${getStatusColor(task.status)} capitalize`}>{task.status}</span>
              <span className={`badge ${getPriorityColor(task.priority)} capitalize`}>{task.priority}</span>
              {overdue && <span className="badge bg-red-100 text-red-700">Overdue</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">{task.title}</h1>
            {task.description ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No description provided</p>
            )}
            {task.tags?.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <TagIcon className="w-3.5 h-3.5 text-gray-400" />
                {task.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Change status */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize ${
                    task.status === s
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <MessageSquareIcon className="w-4 h-4" />
              Comments ({comments.length})
            </h3>

            {/* Comment list */}
            <div className="space-y-4 mb-5">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                      {comment.author?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900">{comment.author?.name}</span>
                        <span className="text-xs text-gray-400">{format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        {comment.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
                      </div>
                      {editingComment === comment._id ? (
                        <div className="mt-1">
                          <textarea
                            className="input resize-none text-sm"
                            rows={2}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => handleEditComment(comment._id)} className="btn-primary text-xs px-3 py-1">Save</button>
                            <button onClick={() => setEditingComment(null)} className="btn-secondary text-xs px-3 py-1">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
                      )}
                      {(comment.author?._id === user._id || isAdmin) && editingComment !== comment._id && (
                        <div className="flex gap-2 mt-1">
                          {comment.author?._id === user._id && (
                            <button onClick={() => { setEditingComment(comment._id); setEditText(comment.content); }} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
                          )}
                          <button onClick={() => handleDeleteComment(comment._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add comment */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-1.5">
                {user.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <textarea
                  className="input resize-none text-sm"
                  rows={2}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex justify-end mt-1">
                  <button type="submit" disabled={submitting || !commentText.trim()} className="btn-primary text-xs px-3 py-1.5">
                    <SendIcon className="w-3.5 h-3.5" /> {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Task Details</h3>

            <div>
              <p className="text-xs text-gray-500 mb-1">Project</p>
              <Link to={`/projects/${task.project?._id}`} className="text-sm text-blue-600 hover:underline">{task.project?.name}</Link>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Assigned To</p>
              {task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                    {task.assignedTo.name?.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-700">{task.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-semibold">
                  {task.createdBy?.name?.charAt(0)}
                </div>
                <span className="text-sm text-gray-700">{task.createdBy?.name}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CalendarIcon className="w-3 h-3" />Due Date</p>
              {task.dueDate ? (
                <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{formatDate(task.dueDate)}</span>
              ) : (
                <span className="text-sm text-gray-400">Not set</span>
              )}
            </div>

            {task.estimatedHours && (
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><ClockIcon className="w-3 h-3" />Estimated</p>
                <span className="text-sm text-gray-700">{task.estimatedHours}h</span>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <span className="text-sm text-gray-700">{formatDate(task.createdAt)}</span>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Last Updated</p>
              <span className="text-sm text-gray-700">{formatDate(task.updatedAt)}</span>
            </div>

            {task.completedAt && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Completed</p>
                <span className="text-sm text-green-600">{formatDate(task.completedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <TaskModal
          task={task}
          onClose={() => setShowEditModal(false)}
          onSave={() => { setShowEditModal(false); fetchTask(); }}
        />
      )}
    </div>
  );
}

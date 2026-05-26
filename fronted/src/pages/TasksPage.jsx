import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, SearchIcon, CheckSquareIcon, CalendarIcon, UserIcon, AlertTriangleIcon, TrashIcon, EditIcon } from 'lucide-react';
import { getStatusColor, getPriorityColor, formatDate, isOverdue, STATUSES, PRIORITIES } from '../utils/helpers';
import TaskModal from '../components/tasks/TaskModal';

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', project: '', overdue: '' });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    projectAPI.getAll({ limit: 100 }).then((r) => setProjects(r.data.data)).catch(() => {});
  }, []);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
    taskAPI.getAll(params)
      .then((r) => { setTasks(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const setFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await taskAPI.updateStatus(id, status);
      setTasks((prev) => prev.map((t) => t._id === id ? { ...t, status } : t));
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total || 0} total tasks</p>
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
        </div>
        <select className="input w-36" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All status</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select className="input w-36" value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}>
          <option value="">All priority</option>
          {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <select className="input w-44" value={filters.project} onChange={(e) => setFilter('project', e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.overdue === 'true'} onChange={(e) => setFilter('overdue', e.target.checked ? 'true' : '')} className="rounded" />
          <span className="text-sm text-gray-700 flex items-center gap-1"><AlertTriangleIcon className="w-3.5 h-3.5 text-red-500" />Overdue</span>
        </label>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckSquareIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No tasks found</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Create first task</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);
            return (
              <div key={task._id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/tasks/${task._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate max-w-xs">{task.title}</Link>
                    <span className={`badge ${getStatusColor(task.status)} capitalize text-xs`}>{task.status}</span>
                    <span className={`badge ${getPriorityColor(task.priority)} capitalize text-xs`}>{task.priority}</span>
                    {overdue && <span className="badge bg-red-100 text-red-700 text-xs">Overdue</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><CheckSquareIcon className="w-3 h-3" />{task.project?.name}</span>
                    {task.assignedTo && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{task.assignedTo.name}</span>}
                    {task.dueDate && <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}><CalendarIcon className="w-3 h-3" />{formatDate(task.dueDate)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => { setEditTask(task); setShowModal(true); }} className="p-1.5 hover:bg-gray-200 rounded-lg">
                    <EditIcon className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(task._id)} className="p-1.5 hover:bg-red-100 rounded-lg">
                    <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {showModal && <TaskModal task={editTask} onClose={() => { setShowModal(false); setEditTask(null); }} onSave={() => { setShowModal(false); setEditTask(null); fetchTasks(); }} />}
    </div>
  );
}

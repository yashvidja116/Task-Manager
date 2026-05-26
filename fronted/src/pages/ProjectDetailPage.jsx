import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PlusIcon, EditIcon, UsersIcon, CalendarIcon, TagIcon } from 'lucide-react';
import { getStatusColor, getPriorityColor, formatDate, isOverdue } from '../utils/helpers';
import TaskModal from '../components/tasks/TaskModal';
import ProjectModal from '../components/projects/ProjectModal';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { key: 'in-progress', label: 'In Progress', color: 'bg-blue-50' },
  { key: 'review', label: 'Review', color: 'bg-yellow-50' },
  { key: 'completed', label: 'Completed', color: 'bg-green-50' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const fetchAll = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getOne(id),
        taskAPI.getAll({ project: id, limit: 100 }),
      ]);
      setProject(projRes.data.data);
      setTasks(taskRes.data.data);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return <div className="p-6"><div className="h-64 bg-gray-200 rounded-xl animate-pulse" /></div>;
  if (!project) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-lg mt-0.5"><ArrowLeftIcon className="w-4 h-4" /></Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`badge ${getStatusColor(project.status)} capitalize`}>{project.status}</span>
              <span className={`badge ${getPriorityColor(project.priority)} capitalize`}>{project.priority}</span>
            </div>
            {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" />{project.members?.length || 0} members</div>
              {project.dueDate && <div className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" />Due {formatDate(project.dueDate)}</div>}
              {project.tags?.length > 0 && <div className="flex items-center gap-1"><TagIcon className="w-3.5 h-3.5" />{project.tags.join(', ')}</div>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-9 sm:ml-0">
          {isAdmin && <button onClick={() => setShowProjectModal(true)} className="btn-secondary"><EditIcon className="w-4 h-4" /> Edit</button>}
          <button onClick={() => { setEditTask(null); setShowTaskModal(true); }} className="btn-primary"><PlusIcon className="w-4 h-4" /> Add Task</button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => (
          <div key={col.key} className={`rounded-xl p-4 ${col.color} min-h-[300px]`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
              <span className="bg-white text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                {tasksByStatus[col.key]?.length || 0}
              </span>
            </div>
            <div className="space-y-2">
              {tasksByStatus[col.key]?.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={() => { setEditTask(task); setShowTaskModal(true); }}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={() => { setShowTaskModal(false); setEditTask(null); fetchAll(); }}
        />
      )}
      {showProjectModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjectModal(false)}
          onSave={() => { setShowProjectModal(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onStatusChange }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link to={`/tasks/${task._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 flex-1">{task.title}</Link>
        <button onClick={onEdit} className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0 opacity-0 group-hover:opacity-100">
          <EditIcon className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`badge ${getPriorityColor(task.priority)} capitalize text-xs`}>{task.priority}</span>
        {overdue && <span className="badge bg-red-100 text-red-700 text-xs">Overdue</span>}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          {task.assignedTo ? (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold" title={task.assignedTo.name}>
              {task.assignedTo.name?.charAt(0)}
            </div>
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </div>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  );
}

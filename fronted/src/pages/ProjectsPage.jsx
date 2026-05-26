import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, SearchIcon, FolderIcon, UsersIcon, CalendarIcon, MoreVerticalIcon, TrashIcon, EditIcon } from 'lucide-react';
import { getStatusColor, getPriorityColor, formatDate, PROJECT_STATUSES } from '../utils/helpers';
import ProjectModal from '../components/projects/ProjectModal';

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    projectAPI.getAll({ page, limit: 12, search, status: statusFilter })
      .then((res) => {
        setProjects(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id) => {
    if (!confirm('Delete project and all its tasks?')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch { toast.error('Failed to delete'); }
    setOpenMenu(null);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditProject(null);
    fetchProjects();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total || 0} total projects</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditProject(null); setShowModal(true); }} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="input pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input sm:w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No projects found</p>
          {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Create first project</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="card hover:shadow-md transition-shadow relative group">
              {/* Menu */}
              {isAdmin && (
                <div className="absolute top-4 right-4">
                  <button onClick={(e) => { e.preventDefault(); setOpenMenu(openMenu === project._id ? null : project._id); }} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all">
                    <MoreVerticalIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  {openMenu === project._id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button onClick={() => { setEditProject(project); setShowModal(true); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <EditIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(project._id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <TrashIcon className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Link to={`/projects/${project._id}`} className="block">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`badge ${getStatusColor(project.status)} capitalize`}>{project.status}</span>
                  <span className={`badge ${getPriorityColor(project.priority)} capitalize`}>{project.priority}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="w-3.5 h-3.5" />
                    <span>{project.members?.length || 0} members</span>
                  </div>
                  {project.dueDate && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{formatDate(project.dueDate)}</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
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

      {showModal && <ProjectModal project={editProject} onClose={() => { setShowModal(false); setEditProject(null); }} onSave={handleSave} />}
    </div>
  );
}

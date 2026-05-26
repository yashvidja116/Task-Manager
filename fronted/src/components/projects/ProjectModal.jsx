import React, { useState, useEffect } from 'react';
import { projectAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { XIcon } from 'lucide-react';
import { PROJECT_STATUSES, PRIORITIES } from '../../utils/helpers';

export default function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    priority: project?.priority || 'medium',
    dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : '',
    tags: project?.tags?.join(', ') || '',
  });
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(
    project?.members?.map((m) => ({ userId: m.user._id || m.user, role: m.role })) || []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userAPI.getMembers().then((res) => setMembers(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        members: selectedMembers.map((m) => ({ user: m.userId, role: m.role })),
      };
      if (project) {
        await projectAPI.update(project._id, payload);
        toast.success('Project updated');
      } else {
        await projectAPI.create(payload);
        toast.success('Project created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.userId === userId);
      if (exists) return prev.filter((m) => m.userId !== userId);
      return [...prev, { userId, role: 'developer' }];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><XIcon className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Website Redesign" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Project description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {PROJECT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="frontend, api, ux" />
          </div>

          <div>
            <label className="label">Team Members</label>
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
              {members.length === 0 ? <p className="p-3 text-sm text-gray-400">No members available</p> : members.map((m) => {
                const selected = selectedMembers.find((s) => s.userId === m._id);
                return (
                  <label key={m._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                    <input type="checkbox" checked={!!selected} onChange={() => toggleMember(m._id)} className="rounded" />
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    </div>
                    {selected && (
                      <select
                        value={selected.role}
                        onChange={(e) => setSelectedMembers((prev) => prev.map((s) => s.userId === m._id ? { ...s, role: e.target.value } : s))}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-200 rounded px-1 py-0.5"
                      >
                        <option value="developer">Developer</option>
                        <option value="manager">Manager</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

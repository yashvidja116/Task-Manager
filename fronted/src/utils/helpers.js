export const getStatusColor = (status) => {
  const map = {
    todo: 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    'on-hold': 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export const getPriorityColor = (priority) => {
  const map = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
    critical: 'bg-purple-100 text-purple-700',
  };
  return map[priority] || 'bg-gray-100 text-gray-700';
};

export const getPriorityDot = (priority) => {
  const map = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
    critical: 'bg-purple-600',
  };
  return map[priority] || 'bg-gray-400';
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  return new Date() > new Date(dueDate);
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const STATUSES = ['todo', 'in-progress', 'review', 'completed'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const PROJECT_STATUSES = ['active', 'on-hold', 'completed', 'archived'];

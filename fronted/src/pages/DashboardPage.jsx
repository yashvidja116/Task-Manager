import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  CheckCircleIcon, ClockIcon, AlertTriangleIcon, FolderIcon,
  UsersIcon, TrendingUpIcon, ArrowRightIcon,
} from 'lucide-react';
import { getPriorityColor, getStatusColor } from '../utils/helpers';

const COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };
const STATUS_COLORS = { todo: '#94a3b8', 'in-progress': '#3b82f6', review: '#f59e0b', completed: '#22c55e' };

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
    </div>
  );

  const statCards = [
    { label: 'Total Tasks', value: stats?.tasks.total ?? 0, icon: TrendingUpIcon, color: 'blue', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Completed', value: stats?.tasks.completed ?? 0, icon: CheckCircleIcon, color: 'green', bg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'In Progress', value: stats?.tasks.inProgress ?? 0, icon: ClockIcon, color: 'yellow', bg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { label: 'Overdue', value: stats?.tasks.overdue ?? 0, icon: AlertTriangleIcon, color: 'red', bg: 'bg-red-50', iconColor: 'text-red-600' },
    { label: 'Projects', value: stats?.projects.total ?? 0, icon: FolderIcon, color: 'purple', bg: 'bg-purple-50', iconColor: 'text-purple-600' },
    ...(isAdmin ? [{ label: 'Team Members', value: stats?.users ?? 0, icon: UsersIcon, color: 'indigo', bg: 'bg-indigo-50', iconColor: 'text-indigo-600' }] : []),
  ];

  const priorityData = Object.entries(stats?.priorityBreakdown || {}).map(([name, value]) => ({ name, value }));
  const statusData = [
    { name: 'To Do', value: stats?.tasks.todo ?? 0, color: STATUS_COLORS.todo },
    { name: 'In Progress', value: stats?.tasks.inProgress ?? 0, color: STATUS_COLORS['in-progress'] },
    { name: 'Review', value: stats?.tasks.review ?? 0, color: STATUS_COLORS.review },
    { name: 'Completed', value: stats?.tasks.completed ?? 0, color: STATUS_COLORS.completed },
  ].filter((d) => d.value > 0);

  const activityData = (stats?.taskActivity || []).map((d) => ({
    date: format(parseISO(d._id), 'MMM d'),
    tasks: d.count,
  }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task activity chart */}
        <div className="lg:col-span-2 card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Task Activity (Last 7 Days)</h2>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No activity data</div>
          )}
        </div>

        {/* Status pie chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Task Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No tasks yet</div>
          )}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
        {stats?.recentTasks?.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {stats.recentTasks.map((task) => (
              <Link to={`/tasks/${task._id}`} key={task._id} className="flex items-center gap-4 py-3 hover:bg-gray-50 -mx-6 px-6 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 truncate">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${getStatusColor(task.status)}`}>{task.status}</span>
                  <span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No recent tasks</p>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

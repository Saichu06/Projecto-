import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FolderKanban,
  CheckSquare2,
  Clock,
  CheckCircle2,
  Check,
  TrendingUp,
  Plus,
  ArrowRight,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  SkeletonMetrics,
  SkeletonBox,
} from '../components/common/SkeletonLoader';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { ProjectModal } from '../components/projects/ProjectModal';
import { TaskModal } from '../components/tasks/TaskModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [statsData, projectsData, tasksData] = await Promise.all([
        api.getDashboard(),
        api.getProjects({ limit: 100 }),
        api.getTasks({ limit: 100 }),
      ]);
      setStats(statsData);
      setProjects(projectsData || []);
      setAllTasks(tasksData || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Global Keyboard Shortcuts (P for Project, N for Task)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input, textarea, or select
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsProjectModalOpen(true);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsTaskModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateProject = async (projectData) => {
    setActionLoading(true);
    try {
      await api.createProject(projectData);
      setIsProjectModalOpen(false);
      showSuccess('Project created successfully!');
      await fetchDashboardData();
    } catch (err) {
      showError(err.message || 'Failed to create project.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    setActionLoading(true);
    try {
      await api.createTask(taskData);
      setIsTaskModalOpen(false);
      showSuccess('Task created successfully!');
      await fetchDashboardData();
    } catch (err) {
      showError(err.message || 'Failed to create task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const prevStats = stats;
    const prevAllTasks = allTasks;

    // Optimistic UI updates
    if (stats) {
      const isNowCompleted = newStatus === 'COMPLETED';
      setStats({
        ...stats,
        completedTasks: Math.max(0, (stats.completedTasks || 0) + (isNowCompleted ? 1 : -1)),
        pendingTasks: Math.max(0, (stats.pendingTasks || 0) + (isNowCompleted ? -1 : 1)),
        recentTasks: (stats.recentTasks || []).map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        ),
      });
    }

    setAllTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.updateTask(task.id, { status: newStatus });
      showSuccess(newStatus === 'COMPLETED' ? 'Task marked as completed!' : 'Task set to pending.');
      await fetchDashboardData();
    } catch (err) {
      setStats(prevStats);
      setAllTasks(prevAllTasks);
      showError(err.message || 'Failed to update task status.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Extract upcoming tasks based on dueDate
  const upcomingTasks = allTasks
    .filter((t) => t.status !== 'COMPLETED')
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    })
    .slice(0, 4);

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Projects in Progress',
      value: stats?.projectsInProgress || 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      title: 'Total Tasks',
      value: stats?.totalTasks || 0,
      icon: CheckSquare2,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
    {
      title: 'Completed Tasks',
      value: stats?.completedTasks || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.fullName || 'User'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here's an overview of your projects and task progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition shadow-xs focus:ring-2 focus:ring-primary/20"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            New Task <kbd className="hidden md:inline px-1 bg-slate-100 rounded text-[10px] text-slate-400 font-mono">N</kbd>
          </button>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition shadow-xs focus:ring-2 focus:ring-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Project <kbd className="hidden md:inline px-1 bg-blue-700/60 rounded text-[10px] text-blue-100 font-mono">P</kbd>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-sm text-rose-700">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick Start Onboarding Section (Visible only when user has 0 projects) */}
      {!loading && stats?.totalProjects === 0 && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Quick Start Guide</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Welcome to Projecto! Let's get organized.
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Follow these simple steps to kick off your deliverables and track milestones:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mb-2">
                  1
                </span>
                <p className="text-xs font-bold text-slate-800">Create a Project</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Define goals and timelines.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center mb-2">
                  2
                </span>
                <p className="text-xs font-bold text-slate-800">Add Tasks</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Assign priority and deadlines.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center mb-2">
                  3
                </span>
                <p className="text-xs font-bold text-slate-800">Track Progress</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Watch metrics auto-update.</p>
              </div>
            </div>

            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Your First Project
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      {loading ? (
        <SkeletonMetrics />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">{stat.title}</span>
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Tasks Section (If upcoming deadline tasks exist) */}
      {!loading && upcomingTasks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-slate-900">Upcoming Tasks</h2>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              All tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task);
                        }}
                        title="Mark as completed"
                        aria-label="Mark task as completed"
                        className="w-4 h-4 rounded border border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 flex items-center justify-center transition shrink-0 mt-0.5 cursor-pointer text-transparent hover:text-emerald-500"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {task.name}
                      </span>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.project?.name && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 ml-6">{task.project.name}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                  </span>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-2">
              <SkeletonBox className="h-12 w-full" />
              <SkeletonBox className="h-12 w-full" />
              <SkeletonBox className="h-12 w-full" />
            </div>
          ) : stats?.recentProjects && stats.recentProjects.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recentProjects.map((proj) => (
                <div key={proj.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${proj.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-primary transition truncate block"
                    >
                      {proj.name}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {proj.taskCount || 0} tasks
                    </span>
                  </div>
                  <StatusBadge status={proj.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No projects created yet. Click "New Project" to start.
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Tasks</h2>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-2">
              <SkeletonBox className="h-12 w-full" />
              <SkeletonBox className="h-12 w-full" />
              <SkeletonBox className="h-12 w-full" />
            </div>
          ) : stats?.recentTasks && stats.recentTasks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recentTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                return (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task);
                        }}
                        title={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
                        aria-label={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-transparent hover:text-emerald-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.name}
                        </p>
                        {task.project?.name && (
                          <p className="text-[11px] text-slate-400 truncate">{task.project.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No tasks created yet. Click "New Task" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleCreateProject}
        isLoading={actionLoading}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateTask}
        projects={projects}
        isLoading={actionLoading}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Filter, CheckSquare2, AlertCircle, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { TaskRow } from '../components/tasks/TaskRow';
import { TaskModal } from '../components/tasks/TaskModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SkeletonTaskRow } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';

export const TasksPage = () => {
  const { showSuccess, showError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTasksAndProjects = async () => {
    try {
      setError('');
      const params = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (projectFilter) params.projectId = projectFilter;

      const [tasksData, projectsData] = await Promise.all([
        api.getTasks(params),
        api.getProjects({ limit: 100 }),
      ]);

      setTasks(tasksData || []);
      if (tasksData.pagination) {
        setPagination(tasksData.pagination);
      }
      setProjects(projectsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  const searchInputRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (projects.length > 0) {
          handleOpenCreate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projects]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasksAndProjects();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, projectFilter, sortBy, sortOrder, page]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (formData) => {
    setActionLoading(true);
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
        showSuccess('Task updated successfully!');
      } else {
        await api.createTask(formData);
        showSuccess('Task created successfully!');
      }
      setIsModalOpen(false);
      await fetchTasksAndProjects();
    } catch (err) {
      showError(err.message || 'Failed to save task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    setActionLoading(true);
    try {
      await api.deleteTask(deletingTask.id);
      showSuccess('Task deleted successfully.');
      setDeletingTask(null);
      await fetchTasksAndProjects();
    } catch (err) {
      showError(err.message || 'Failed to delete task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const originalTasks = [...tasks];

    // Optimistic UI update: instantly update the task in local state
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.updateTask(task.id, { status: newStatus });
      showSuccess(newStatus === 'COMPLETED' ? 'Task marked as completed!' : 'Task set to pending.');
      await fetchTasksAndProjects();
    } catch (err) {
      // Revert optimistic update on failure
      setTasks(originalTasks);
      showError(err.message || 'Failed to update task status.');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setProjectFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasFilters = Boolean(search || statusFilter || priorityFilter || projectFilter || sortBy !== 'createdAt');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View, filter, and track all your tasks across projects.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={projects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition shadow-xs self-start sm:self-auto disabled:opacity-50 focus:ring-2 focus:ring-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {projects.length === 0 && !loading && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
          <span>You need to create a project first before adding tasks.</span>
        </div>
      )}

      {/* Filter, Sort and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search tasks by name..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition truncate max-w-full"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="dueDate:asc">Due Date (Earliest)</option>
              <option value="priority:desc">Priority (High-Low)</option>
              <option value="name:asc">Name (A-Z)</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              title="Clear Filters"
              className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-sm text-rose-700">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTasksAndProjects}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Task List Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonTaskRow key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare2}
          title={hasFilters ? 'No tasks match your filters' : 'No tasks created yet'}
          description={
            hasFilters
              ? 'Try modifying your search query or reset filter parameters.'
              : projects.length === 0
              ? 'Create a project first before adding deliverables.'
              : 'Add your first task to start tracking progress.'
          }
          actionLabel={
            hasFilters ? 'Reset Filters' : projects.length > 0 ? 'Create Task' : undefined
          }
          onAction={hasFilters ? handleClearFilters : handleOpenCreate}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onEdit={handleOpenEdit}
                onDelete={(t) => setDeletingTask(t)}
                showProjectBadge={true}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 text-xs text-slate-500 bg-slate-50/50">
              <span>
                Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
                <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:pointer-events-none transition shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:pointer-events-none transition shadow-xs"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Create/Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        projects={projects}
        isLoading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.name}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDestructive={true}
        isLoading={actionLoading}
      />
    </div>
  );
};

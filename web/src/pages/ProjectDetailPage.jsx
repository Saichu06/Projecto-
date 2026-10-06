import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  ChevronRight,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  Search,
  CheckSquare2,
  X,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonBox, SkeletonTaskRow } from '../components/common/SkeletonLoader';
import { TaskRow } from '../components/tasks/TaskRow';
import { TaskModal } from '../components/tasks/TaskModal';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Task filtering
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setError('');
      const data = await api.getProject(id);
      setProject(data);
    } catch (err) {
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleUpdateProject = async (formData) => {
    setActionLoading(true);
    try {
      await api.updateProject(id, formData);
      setIsProjectModalOpen(false);
      showSuccess('Project updated successfully!');
      await fetchProjectDetails();
    } catch (err) {
      showError(err.message || 'Failed to update project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    setActionLoading(true);
    try {
      await api.deleteProject(id);
      showSuccess('Project deleted successfully.');
      navigate('/projects', { replace: true });
    } catch (err) {
      showError(err.message || 'Failed to delete project');
      setActionLoading(false);
    }
  };

  const handleSaveTask = async (formData) => {
    setActionLoading(true);
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
        showSuccess('Task updated successfully!');
      } else {
        await api.createTask({ ...formData, projectId: id });
        showSuccess('Task added to project!');
      }
      setIsTaskModalOpen(false);
      await fetchProjectDetails();
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
      await fetchProjectDetails();
    } catch (err) {
      showError(err.message || 'Failed to delete task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const previousProject = project;

    // Optimistic UI update
    if (project) {
      const updatedTasks = (project.tasks || []).map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      );
      const totalTasks = updatedTasks.length;
      const completedTasks = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setProject({
        ...project,
        tasks: updatedTasks,
        completedTaskCount: completedTasks,
        progress: progressPercentage,
      });
    }

    try {
      await api.updateTask(task.id, { status: newStatus });
      showSuccess(newStatus === 'COMPLETED' ? 'Task marked as completed!' : 'Task set to pending.');
      await fetchProjectDetails();
    } catch (err) {
      setProject(previousProject);
      showError(err.message || 'Failed to update task status.');
    }
  };

  const handleClearTaskFilters = () => {
    setTaskSearch('');
    setTaskStatusFilter('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBox className="h-4 w-32" />
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <SkeletonBox className="h-8 w-1/3" />
          <SkeletonBox className="h-4 w-2/3" />
          <SkeletonBox className="h-2 w-full rounded-full" />
        </div>
        <div className="space-y-3">
          <SkeletonTaskRow />
          <SkeletonTaskRow />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto mt-12 shadow-xs">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Project Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          {error || 'The requested project could not be found or has been removed.'}
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition shadow-xs"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const hasTaskFilters = Boolean(taskSearch || taskStatusFilter);

  const filteredTasks = (project.tasks || []).filter((task) => {
    const matchesSearch = taskSearch.trim()
      ? task.name.toLowerCase().includes(taskSearch.toLowerCase())
      : true;
    const matchesStatus = taskStatusFilter ? task.status === taskStatusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/projects" className="hover:text-primary transition">
          Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{project.name}</span>
      </nav>

      {/* Project Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {project.description || 'No description provided.'}
            </p>

            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                {project.startDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Starts: {formatDate(project.startDate)}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ends: {formatDate(project.endDate)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition shadow-xs focus:ring-2 focus:ring-primary/20"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Project
            </button>
            <button
              onClick={() => setDeletingProject(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition shadow-xs focus:ring-2 focus:ring-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Progress summary */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="col-span-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span>Overall Completion</span>
              <span>{project.progress || 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-start sm:justify-end gap-2 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {project.completedTaskCount || 0} of {project.taskCount || 0} tasks completed
            </span>
          </div>
        </div>
      </div>

      {/* Project Tasks Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Project Tasks</h2>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition shadow-xs self-start sm:self-auto focus:ring-2 focus:ring-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {/* Search and filter */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Search tasks in this project..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="w-full sm:w-40 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {hasTaskFilters && (
              <button
                onClick={handleClearTaskFilters}
                title="Clear Filters"
                className="px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Tasks list */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare2}
            title={hasTaskFilters ? 'No matching tasks' : 'No tasks in this project yet'}
            description={
              hasTaskFilters
                ? 'Try changing your search keywords or status filter.'
                : 'Break this project down into manageable actionable tasks.'
            }
            actionLabel={hasTaskFilters ? 'Reset Filters' : 'Add Task'}
            onAction={
              hasTaskFilters
                ? handleClearTaskFilters
                : () => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }
            }
          />
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
                onDelete={(t) => setDeletingTask(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        defaultProjectId={id}
        isLoading={actionLoading}
      />

      {/* Project Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleUpdateProject}
        project={project}
        isLoading={actionLoading}
      />

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={deletingProject}
        onClose={() => setDeletingProject(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? All associated tasks inside this project will be permanently deleted.`}
        confirmText="Delete Project"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.name}"?`}
        confirmText="Delete Task"
        isDestructive={true}
        isLoading={actionLoading}
      />
    </div>
  );
};

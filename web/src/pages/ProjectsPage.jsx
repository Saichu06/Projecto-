import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Filter, FolderKanban, AlertCircle, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SkeletonProjectCard } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';

export const ProjectsPage = () => {
  const { showSuccess, showError } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setError('');
      const params = {
        page,
        limit: 9,
        sortBy,
        sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await api.getProjects(params);
      setProjects(data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const searchInputRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleOpenCreate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortBy, sortOrder, page]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (formData) => {
    setActionLoading(true);
    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, formData);
        showSuccess('Project updated successfully!');
      } else {
        await api.createProject(formData);
        showSuccess('Project created successfully!');
      }
      setIsModalOpen(false);
      await fetchProjects();
    } catch (err) {
      showError(err.message || 'Failed to save project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    setActionLoading(true);
    try {
      await api.deleteProject(deletingProject.id);
      showSuccess(`Project "${deletingProject.name}" and associated tasks deleted.`);
      setDeletingProject(null);
      await fetchProjects();
    } catch (err) {
      showError(err.message || 'Failed to delete project.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasFilters = Boolean(search || statusFilter || sortBy !== 'createdAt' || sortOrder !== 'desc');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, manage, and track progress across all your initiatives.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition shadow-xs self-start sm:self-auto focus:ring-2 focus:ring-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filter, Sort and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
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
            placeholder="Search projects by name..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
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
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="startDate:asc">Start Date (Earliest)</option>
              <option value="endDate:asc">End Date (Earliest)</option>
              <option value="status:asc">Status</option>
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
            onClick={fetchProjects}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={hasFilters ? 'No projects match your search or filter' : 'No projects yet'}
          description={
            hasFilters
              ? 'Try modifying your search keywords or resetting the status filter.'
              : 'Create your first project to organize tasks and track deliverables.'
          }
          actionLabel={hasFilters ? 'Reset Filters' : 'Create Project'}
          onAction={hasFilters ? handleClearFilters : handleOpenCreate}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleOpenEdit}
                onDelete={(proj) => setDeletingProject(proj)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-500">
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
        </>
      )}

      {/* Create / Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
        isLoading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? All associated tasks within this project will be permanently removed (cascade deletion).`}
        confirmText="Delete Project"
        isDestructive={true}
        isLoading={actionLoading}
      />
    </div>
  );
};

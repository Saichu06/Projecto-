import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const ProjectCard = ({ project, onEdit, onDelete }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <Link
            to={`/projects/${project.id}`}
            className="text-base font-semibold text-slate-900 hover:text-primary transition line-clamp-1"
          >
            {project.name}
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={project.status} />
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[32px]">
          {project.description || 'No description provided.'}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Progress</span>
            <span>{project.progress || 0}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                project.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : project.status === 'IN_PROGRESS'
                  ? 'bg-primary'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {project.completedTaskCount || 0}/{project.taskCount || 0} tasks
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(project)}
            title="Edit Project"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project)}
            title="Delete Project"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <Link
            to={`/projects/${project.id}`}
            title="View Details"
            className="p-1.5 text-primary hover:bg-primary-light rounded-md transition ml-1"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

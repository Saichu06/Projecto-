import React from 'react';
import { Calendar, Check, Edit2, Trash2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';

export const TaskRow = ({ task, onToggleComplete, onEdit, onDelete }) => {
  const isCompleted = task.status === 'COMPLETED';

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition">
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        {/* Completion Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          title={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
          aria-label={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shrink-0 mt-0.5 sm:mt-0 cursor-pointer ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-transparent hover:text-emerald-500'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-semibold transition truncate ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {task.name}
            </h4>
            {task.project?.name && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[150px]">
                {task.project.name}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
          )}
        </div>
      </div>

      {/* Meta badges and actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            title="Edit Task"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            title="Delete Task"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

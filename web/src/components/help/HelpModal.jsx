import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
  BookOpen,
  Zap,
  Keyboard,
  Info,
  Layers,
  CheckCircle2,
  FolderKanban,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

export const HelpModal = ({ isOpen, onClose, initialTab = 'guide' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'guide', label: 'User Guide', icon: BookOpen },
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Documentation" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition -mb-px ${
                  isActive
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: User Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[380px] overflow-y-auto pr-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-primary" /> Getting Started
              </h4>
              <p>
                Projecto is designed for seamless project tracking and task execution. Begin by creating an initiative in the Projects section, then break it down into actionable tasks.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <FolderKanban className="w-4 h-4 text-primary" /> Projects
              </h4>
              <p>
                Each project has a lifecycle status (<em>Not Started</em>, <em>In Progress</em>, or <em>Completed</em>) and calculates automated completion progress based on completed tasks.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Tasks
              </h4>
              <p>
                Tasks belong to projects and can be filtered by status and priority (<em>Low</em>, <em>Medium</em>, <em>High</em>). Click the checkbox next to any task to quickly toggle its completion status.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Layers className="w-4 h-4 text-primary" /> Dashboard
              </h4>
              <p>
                The dashboard gives a real-time aggregate of your active projects, tasks pending, and upcoming deadlines computed strictly for your authenticated account.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-primary" /> Account
              </h4>
              <p>
                Manage your profile details and update your password securely via the profile menu in the top navigation.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Smartphone className="w-4 h-4 text-primary" /> Mobile App
              </h4>
              <p>
                The React Native Expo app shares the exact same backend and database. Tokens are stored in hardware-encrypted storage (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">expo-secure-store</code>). Pull down to refresh data anytime.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Quick Start */}
        {activeTab === 'quickstart' && (
          <div className="space-y-4 text-xs text-slate-600">
            <p className="text-slate-700 font-medium">
              Follow these three simple steps to set up your workflow:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-0.5">Create your first Project</h5>
                  <p className="text-slate-500">
                    Click <strong>"+ New Project"</strong> in the top header or Projects page. Give your initiative a title, optional timeline, and description.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-0.5">Add & Assign Tasks</h5>
                  <p className="text-slate-500">
                    Click <strong>"+ New Task"</strong> to add action items, set priority levels (High, Medium, Low), and assign optional due dates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-0.5">Track & Complete Deliverables</h5>
                  <p className="text-slate-500">
                    Check off tasks as they finish. Your project progress bar and dashboard statistics update in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Keyboard Shortcuts */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-500 mb-2">
              Use global keyboard shortcuts to navigate and create resources rapidly:
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center justify-between p-3 bg-slate-50/50">
                <span className="font-medium text-slate-800">Create New Project</span>
                <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-slate-800">
                  P
                </kbd>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="font-medium text-slate-800">Create New Task</span>
                <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-slate-800">
                  N
                </kbd>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/50">
                <span className="font-medium text-slate-800">Focus Search Input</span>
                <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-slate-800">
                  /
                </kbd>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="font-medium text-slate-800">Close Modals / Dropdowns</span>
                <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-slate-800">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: About Projecto */}
        {activeTab === 'about' && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">PROJECTO</h4>
                <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold text-[11px]">
                  v1.0.0
                </span>
              </div>
              <p className="text-slate-500">
                Project & Task Management System with unified REST API architecture.
              </p>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900">Core Architecture:</h5>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Shared Node.js + Express REST API Gateway</li>
                <li>PostgreSQL Relational Database via Prisma ORM 6</li>
                <li>React 19 Web Interface + React Native Expo Mobile Client</li>
                <li>Strict multi-tenant ownership query isolation</li>
                <li>Zod schema validation & Bcrypt password security</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

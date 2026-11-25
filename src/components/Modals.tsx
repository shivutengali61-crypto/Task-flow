import { Download, Keyboard, RotateCcw, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { QuickAddBar } from './QuickAddBar';

export function QuickAddModal() {
  const open = useTaskStore((s) => s.quickAddModalOpen);
  const setOpen = useTaskStore((s) => s.setQuickAddModalOpen);
  const activeProjectId = useTaskStore((s) => s.activeProjectId);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 pt-[14vh] backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Create new task"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0F1424]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
            New Task
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close new task modal"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <QuickAddBar
          autoFocus
          defaultProjectId={activeProjectId}
          onTaskCreated={() => setOpen(false)}
        />

        <p className="mt-3 text-[11px] text-slate-500 dark:text-[#94A3B8]">
          Tips: Type natural dates like <span className="font-mono">tomorrow 4pm</span> or{' '}
          <span className="font-mono">next Mon</span>, set priority with{' '}
          <span className="font-mono">!urgent</span> / <span className="font-mono">!high</span>,
          assign a project with <span className="font-mono">#Launch</span>, and add tags with{' '}
          <span className="font-mono">@design</span>.
        </p>
      </div>
    </div>
  );
}

export function ShortcutsModal() {
  const open = useTaskStore((s) => s.shortcutsModalOpen);
  const setOpen = useTaskStore((s) => s.setShortcutsModalOpen);

  if (!open) return null;

  const groups = [
    {
      title: 'General',
      items: [
        ['⌘K / Ctrl+K', 'Open Command Palette'],
        ['N', 'Quick-add new task'],
        ['Shift + T', 'Toggle Dark / Light theme'],
        ['?', 'Open Keyboard Shortcuts'],
        ['Esc', 'Close active modal or inspector'],
      ],
    },
    {
      title: 'Navigation',
      items: [
        ['1', 'Go to Inbox'],
        ['2', 'Go to Today'],
        ['3', 'Go to Upcoming'],
        ['4', 'Go to Calendar'],
        ['5', 'Go to Analytics'],
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0F1424]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-indigo-500" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close shortcuts dialog"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.items.map(([shortcut, desc]) => (
                  <div
                    key={shortcut}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs odd:bg-slate-50 dark:odd:bg-white/[0.02]"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{desc}</span>
                    <kbd className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                      {shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal() {
  const open = useTaskStore((s) => s.settingsModalOpen);
  const setOpen = useTaskStore((s) => s.setSettingsModalOpen);
  const exportDataJson = useTaskStore((s) => s.exportDataJson);
  const importDataJson = useTaskStore((s) => s.importDataJson);
  const resetDemoData = useTaskStore((s) => s.resetDemoData);
  const showToast = useTaskStore((s) => s.showToast);

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!open) return null;

  const handleDownloadBackup = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Exported JSON backup' });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Paste a valid TaskFlow Pro JSON backup first.');
      return;
    }
    const ok = importDataJson(importText);
    if (ok) {
      setImportText('');
      setOpen(false);
    } else {
      setImportError('Invalid backup format. Please check the JSON schema.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Workspace settings and backup"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0F1424]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">
            Data & Local Backup
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close settings dialog"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 dark:border-white/[0.08]">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Export Workspace JSON
              </p>
              <p className="mt-0.5 text-slate-500 dark:text-[#94A3B8]">
                Download all workspaces, projects, tasks, and analytics history.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="tf-gradient inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-white"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              Export
            </button>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-2">
            <label
              htmlFor="backup-json-input"
              className="block font-semibold text-slate-800 dark:text-slate-100"
            >
              Restore from JSON Backup
            </label>
            <textarea
              id="backup-json-input"
              rows={4}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='Paste TaskFlow Pro backup JSON (schemaVersion: 1)...'
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#0B0F1A] dark:text-slate-100"
            />
            {importError && <p className="text-[#EF4444]">{importError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                Import Backup
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-white/[0.08]">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Reset Demo Data</p>
              <p className="mt-0.5 text-slate-500 dark:text-[#94A3B8]">
                Restore the starter workspaces and example tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                setOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 font-semibold text-[#EF4444] hover:bg-red-500/10"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

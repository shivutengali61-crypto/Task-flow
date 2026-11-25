import {
  BarChart3,
  Calendar,
  CalendarClock,
  Inbox,
  Layers,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import React from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { NavView } from '../types/task';

export function MobileTopBar() {
  const theme = useTaskStore((s) => s.theme);
  const toggleTheme = useTaskStore((s) => s.toggleTheme);
  const setMobileDrawerOpen = useTaskStore((s) => s.setMobileDrawerOpen);
  const setCommandPaletteOpen = useTaskStore((s) => s.setCommandPaletteOpen);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-md lg:hidden dark:border-white/[0.07] dark:bg-[#0F1424]/90">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
            TaskFlow
          </span>
          <span className="tf-gradient rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">
            PRO
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Search tasks"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const activeView = useTaskStore((s) => s.activeView);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  const setQuickAddModalOpen = useTaskStore((s) => s.setQuickAddModalOpen);

  const tabs: Array<{
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }> = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'today', label: 'Today', icon: Layers },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Floating '+' Quick Add Action Button on mobile */}
      <button
        type="button"
        onClick={() => setQuickAddModalOpen(true)}
        aria-label="Add new task"
        className="tf-gradient fixed bottom-18 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 md:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>

      {/* Bottom Tab Bar on mobile (<768px) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-slate-200/90 bg-white/95 px-1 backdrop-blur-md md:hidden dark:border-white/[0.08] dark:bg-[#0F1424]/95"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-[#94A3B8]'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

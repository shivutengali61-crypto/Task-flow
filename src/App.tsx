import { useEffect } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { CommandPalette } from './components/CommandPalette';
import { MobileBottomNav, MobileTopBar } from './components/MobileNav';
import { QuickAddModal, SettingsModal, ShortcutsModal } from './components/Modals';
import { Sidebar } from './components/Sidebar';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { TaskListView } from './components/TaskListView';
import { Toast } from './components/Toast';
import { useTaskStore } from './store/useTaskStore';

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export default function App() {
  const activeView = useTaskStore((s) => s.activeView);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  const toggleTheme = useTaskStore((s) => s.toggleTheme);
  const setCommandPaletteOpen = useTaskStore((s) => s.setCommandPaletteOpen);
  const setQuickAddModalOpen = useTaskStore((s) => s.setQuickAddModalOpen);
  const setShortcutsModalOpen = useTaskStore((s) => s.setShortcutsModalOpen);
  const setSettingsModalOpen = useTaskStore((s) => s.setSettingsModalOpen);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);

  // Global Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K always toggles Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const isOpen = useTaskStore.getState().commandPaletteOpen;
        setCommandPaletteOpen(!isOpen);
        return;
      }

      if (e.key === 'Escape') {
        const state = useTaskStore.getState();
        if (state.commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (state.quickAddModalOpen) {
          setQuickAddModalOpen(false);
        } else if (state.shortcutsModalOpen) {
          setShortcutsModalOpen(false);
        } else if (state.settingsModalOpen) {
          setSettingsModalOpen(false);
        } else if (state.selectedTaskId) {
          setSelectedTaskId(null);
        }
        return;
      }

      // Skip single-key shortcuts while typing inside form inputs
      if (isEditableElement(e.target) || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setQuickAddModalOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(true);
      } else if (e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === '1') {
        setActiveView('inbox');
      } else if (e.key === '2') {
        setActiveView('today');
      } else if (e.key === '3') {
        setActiveView('upcoming');
      } else if (e.key === '4') {
        setActiveView('calendar');
      } else if (e.key === '5') {
        setActiveView('analytics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveView,
    setCommandPaletteOpen,
    setQuickAddModalOpen,
    setSelectedTaskId,
    setSettingsModalOpen,
    setShortcutsModalOpen,
    toggleTheme,
  ]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0B0F1A] dark:text-[#F1F5F9]">
      {/* Tablet / Mobile Top Bar */}
      <MobileTopBar />

      {/* 3-Column Responsive Workspace Shell */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Column 1: Left Sidebar (260px collapsible desktop, drawer on tablet/mobile) */}
        <Sidebar />

        {/* Column 2: Main Content Viewport */}
        <main className="tf-scroll min-w-0 flex-1 overflow-y-auto">
          {activeView === 'calendar' ? (
            <CalendarView />
          ) : activeView === 'analytics' ? (
            <AnalyticsView />
          ) : (
            <TaskListView />
          )}
        </main>

        {/* Column 3: Right Task Inspector / Daily Momentum Panel */}
        <TaskDetailPanel />
      </div>

      {/* Mobile Bottom Tab Bar & Floating + Action Button */}
      <MobileBottomNav />

      {/* Overlays & Modals */}
      <CommandPalette />
      <QuickAddModal />
      <ShortcutsModal />
      <SettingsModal />
      <Toast />
    </div>
  );
}

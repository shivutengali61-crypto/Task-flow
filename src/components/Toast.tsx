import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export function Toast() {
  const toast = useTaskStore((s) => s.toast);
  const dismissToast = useTaskStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-6"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-100 shadow-2xl dark:border-white/10 dark:bg-[#161D31]"
          >
            <span className="max-w-[260px] truncate sm:max-w-sm">{toast.message}</span>
            {toast.onUndo && (
              <button
                type="button"
                onClick={toast.onUndo}
                className="font-semibold text-indigo-400 hover:text-indigo-300"
              >
                {toast.undoLabel ?? 'Undo'}
              </button>
            )}
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

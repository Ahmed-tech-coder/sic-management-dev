import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver.current) resolver.current(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver.current) resolver.current(false);
  };

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card shadow-2xl p-6 overflow-hidden z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
            >
              {/* Close Button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 p-1.5 rounded-btn text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex gap-4 items-start mt-2">
                {/* Icon Container */}
                <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${
                  options.type === 'danger'
                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-500'
                    : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-500'
                }`}>
                  {options.type === 'danger' ? (
                    <Trash2 className="w-5.5 h-5.5" />
                  ) : (
                    <AlertTriangle className="w-5.5 h-5.5" />
                  )}
                </div>

                <div className="flex-1 space-y-2.5">
                  <h3 id="confirm-title" className="text-lg font-bold text-neutral-900 dark:text-white leading-6">
                    {options.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {options.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-150 dark:border-neutral-800">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-btn transition-all duration-200 cursor-pointer"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4.5 py-2.5 text-xs font-bold text-white rounded-btn shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ${
                    options.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10'
                      : 'bg-brand hover:bg-brand-hover shadow-brand/10'
                  }`}
                >
                  {options.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

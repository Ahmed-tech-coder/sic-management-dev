import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card shadow-sm">
      {/* Icon Wrapper */}
      <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center mb-5 text-neutral-300 dark:text-neutral-700 animate-pulse">
        <Icon className="w-8 h-8 text-neutral-450 dark:text-neutral-500" />
      </div>
      
      {/* Text Info */}
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-sm text-neutral-450 dark:text-neutral-400 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Optional Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 mt-6 px-4.5 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-btn shadow-md shadow-brand/10 hover:shadow-brand/20 transition-all duration-200 cursor-pointer"
        >
          {action.icon && <action.icon className="w-3.5 h-3.5" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
export default EmptyState;

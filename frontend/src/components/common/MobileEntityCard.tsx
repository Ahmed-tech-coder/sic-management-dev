import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetadataRow {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
}

interface MobileEntityCardProps {
  avatarInitials?: string;
  avatarBgColorClass?: string;
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode[];
  metadata?: MetadataRow[];
  actions?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  }[];
}

export const MobileEntityCard: React.FC<MobileEntityCardProps> = ({
  avatarInitials,
  avatarBgColorClass = 'bg-brand/10 text-brand',
  title,
  subtitle,
  badges,
  metadata,
  actions,
}) => {
  return (
    <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Top Section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatarInitials && (
            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-sm ${avatarBgColorClass}`}>
              {avatarInitials}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100 truncate">{title}</h4>
            {subtitle && <div className="text-xs text-neutral-450 dark:text-neutral-400 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        {/* Badges Container */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {badges}
          </div>
        )}
      </div>

      {/* Metadata list */}
      {metadata && metadata.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-850 text-xs">
          {metadata.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div key={idx} className="flex items-start gap-2 text-neutral-600 dark:text-neutral-300">
                {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />}
                <span className="font-medium text-neutral-450 dark:text-neutral-500 shrink-0">{row.label}:</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold break-words flex-1 min-w-0">{row.value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-850">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            const isDanger = act.variant === 'danger';
            const isPrimary = act.variant === 'primary';
            const isGhost = act.variant === 'ghost';
            return (
              <button
                key={idx}
                onClick={act.onClick}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-btn transition-colors cursor-pointer ${
                  isDanger
                    ? 'text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white dark:hover:bg-rose-600'
                    : isPrimary
                    ? 'bg-brand text-white hover:bg-brand-hover'
                    : isGhost
                    ? 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-350'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

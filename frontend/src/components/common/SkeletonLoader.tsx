import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'table' | 'card' | 'stats';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'table',
  count = 5,
}) => {
  const items = Array.from({ length: count });

  if (variant === 'stats') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card p-5 space-y-3 shadow-sm animate-pulse"
          >
            <div className="w-1/3 h-4.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="w-2/3 h-8 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card p-5 space-y-4 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-2/3 h-4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="w-1/2 h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="space-y-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
              <div className="w-5/6 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="w-4/5 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
              <div className="w-14 h-7.5 bg-neutral-200 dark:bg-neutral-800 rounded-btn" />
              <div className="w-14 h-7.5 bg-neutral-200 dark:bg-neutral-800 rounded-btn" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table skeleton fallback
  return (
    <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card shadow-sm overflow-hidden">
      {/* Skeleton header */}
      <div className="h-13 bg-neutral-50 dark:bg-[#161F30] border-b border-neutral-200 dark:border-neutral-850 px-6 flex items-center">
        <div className="w-1/4 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
      </div>
      {/* Skeleton rows */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {items.map((_, idx) => (
          <div key={idx} className="p-4.5 px-6 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-3/4 h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  <div className="w-1/2 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              </div>
              <div className="w-1/6 h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="w-1/5 h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="w-12 h-6 bg-neutral-200 dark:bg-neutral-800 rounded-btn" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SkeletonLoader;

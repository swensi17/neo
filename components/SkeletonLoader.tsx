import React from 'react';

interface SkeletonLoaderProps {
  isLight?: boolean;
  type?: 'chat-list' | 'message' | 'sidebar';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ isLight = false, type = 'chat-list' }) => {
  const shimmer = isLight 
    ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200' 
    : 'bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800';
  
  const base = isLight ? 'bg-gray-200' : 'bg-zinc-800';

  if (type === 'message') {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className={`${base} rounded-2xl h-12 w-48`} />
        </div>
        {/* AI message skeleton */}
        <div className="flex justify-start">
          <div className="space-y-2 max-w-[70%]">
            <div className={`${base} rounded-lg h-4 w-64`} />
            <div className={`${base} rounded-lg h-4 w-56`} />
            <div className={`${base} rounded-lg h-4 w-48`} />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className="space-y-2 p-2 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg`}>
            <div className={`${base} w-5 h-5 rounded-full flex-shrink-0`} />
            <div className={`${base} h-4 rounded flex-1`} style={{ width: `${60 + Math.random() * 30}%` }} />
          </div>
        ))}
      </div>
    );
  }

  // Default: chat-list
  return (
    <div className="space-y-3 p-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className={`${isLight ? 'bg-gray-100' : 'bg-[#111]'} rounded-xl p-4`}>
          <div className="flex items-start gap-3">
            <div className={`${base} w-10 h-10 rounded-full flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${base} h-4 rounded w-3/4`} />
              <div className={`${base} h-3 rounded w-1/2`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

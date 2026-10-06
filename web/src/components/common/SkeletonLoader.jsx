import React from 'react';

export const SkeletonBox = ({ className = '' }) => (
  <div className={`bg-slate-200/70 animate-pulse rounded-lg ${className}`} />
);

export const SkeletonMetrics = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-7 w-7 rounded-lg" />
        </div>
        <SkeletonBox className="h-7 w-12" />
      </div>
    ))}
  </div>
);

export const SkeletonProjectCard = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-5 w-3/5" />
      <SkeletonBox className="h-5 w-20 rounded-full" />
    </div>
    <SkeletonBox className="h-3 w-4/5" />
    <SkeletonBox className="h-3 w-2/3" />
    <div className="pt-2 space-y-2">
      <div className="flex justify-between">
        <SkeletonBox className="h-3 w-14" />
        <SkeletonBox className="h-3 w-8" />
      </div>
      <SkeletonBox className="h-2 w-full rounded-full" />
    </div>
  </div>
);

export const SkeletonTaskRow = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3.5 flex-1">
      <SkeletonBox className="w-5 h-5 rounded-md shrink-0" />
      <div className="space-y-1.5 flex-1">
        <SkeletonBox className="h-4 w-2/5" />
        <SkeletonBox className="h-3 w-1/4" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <SkeletonBox className="h-5 w-16 rounded-full" />
      <SkeletonBox className="h-5 w-20 rounded-full" />
    </div>
  </div>
);

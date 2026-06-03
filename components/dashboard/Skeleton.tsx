export function SkeletonRow() {
  return (
    <div className="p-6 border-b border-white/5 animate-pulse h-[220px] flex flex-col relative overflow-hidden">
      {/* Matching the JobCard padding and spacing exactly */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 mr-4">
          <div className="h-7 bg-white/[0.03] rounded-lg w-3/4 mb-2"></div>
          <div className="h-3 bg-white/[0.03] rounded-md w-1/2"></div>
        </div>
        <div className="h-[54px] w-[54px] rounded-full bg-white/[0.03] shrink-0"></div>
      </div>

      <div className="flex gap-2.5 mb-6">
        <div className="h-8 bg-white/[0.03] rounded-xl w-20"></div>
        <div className="h-8 bg-white/[0.03] rounded-xl w-16"></div>
        <div className="h-8 bg-white/[0.03] rounded-xl w-24"></div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="h-7 bg-white/[0.02] rounded-2xl w-24"></div>
        <div className="h-7 bg-white/[0.02] rounded-2xl w-28"></div>
      </div>

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/[0.03]">
        <div className="h-4 bg-white/[0.02] rounded-md w-2/3"></div>
        <div className="h-8 bg-white/[0.03] rounded-full w-24"></div>
      </div>

      {/* Shimmer effect simulation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-shimmer" />
    </div>
  )
}

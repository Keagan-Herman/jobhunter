export function SkeletonRow() {
  return (
    <div className="p-3.5 px-4 border-b border-[#0f0f22] animate-pulse">
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex-1 mr-2.5">
          <div className="h-4 bg-[#1a1a3a] rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-[#1a1a3a] rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-[#1a1a3a] rounded w-12"></div>
      </div>
      <div className="flex gap-1.5 mt-2">
        <div className="h-5 bg-[#1a1a3a] rounded w-16"></div>
        <div className="h-5 bg-[#1a1a3a] rounded w-16"></div>
        <div className="h-5 bg-[#1a1a3a] rounded w-16"></div>
      </div>
    </div>
  )
}

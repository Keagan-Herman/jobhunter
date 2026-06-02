export function SkeletonRow() {
  return (
    <div className="p-6 border-b border-white/5 animate-pulse h-[220px] flex flex-col justify-center">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 mr-4">
          <div className="h-6 bg-white/[0.03] rounded-lg w-3/4 mb-3"></div>
          <div className="h-3 bg-white/[0.03] rounded-md w-1/2"></div>
        </div>
        <div className="h-[54px] w-[54px] rounded-full bg-white/[0.03]"></div>
      </div>
      <div className="flex gap-2 mb-6">
        <div className="h-7 bg-white/[0.03] rounded-xl w-20"></div>
        <div className="h-7 bg-white/[0.03] rounded-xl w-16"></div>
        <div className="h-7 bg-white/[0.03] rounded-xl w-24"></div>
      </div>
      <div className="flex justify-between items-center mt-auto pt-5 border-t border-white/[0.02]">
        <div className="h-3 bg-white/[0.03] rounded-md w-2/3"></div>
        <div className="h-6 bg-white/[0.03] rounded-full w-20"></div>
      </div>
    </div>
  )
}

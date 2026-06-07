export function SkeletonRow() {
  return (
    <div className="p-10 border-b border-[#e2e2d9] animate-pulse h-[240px] flex flex-col relative overflow-hidden bg-white transition-transform duration-500 hover:scale-[0.995]">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1 mr-8">
          <div className="h-8 bg-[#f0f0eb] rounded-sm w-3/4 mb-4"></div>
          <div className="h-3.5 bg-[#f0f0eb] rounded-sm w-1/2"></div>
        </div>
        <div className="h-[64px] w-[64px] rounded-full bg-[#f0f0eb] shrink-0"></div>
      </div>

      <div className="flex gap-2.5 mb-8">
        <div className="h-9 bg-[#f0f0eb] rounded-sm w-24"></div>
        <div className="h-9 bg-[#f0f0eb] rounded-sm w-20"></div>
        <div className="h-9 bg-[#f0f0eb] rounded-sm w-28"></div>
      </div>

      <div className="flex justify-between items-center mt-auto pt-6 border-t border-[#e2e2d9]">
        <div className="h-4 bg-[#f0f0eb] rounded-sm w-1/3"></div>
        <div className="h-8 bg-[#f0f0eb] rounded-sm w-24"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c5a05905] to-transparent -translate-x-full animate-shimmer-light" />
    </div>
  )
}

export default function OpenPendingBadge({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const text = size === 'lg' ? 'text-2xl' : 'text-sm'
  const dot = size === 'lg' ? 'h-3 w-3' : 'h-2 w-2'

  return (
    <span className={`inline-flex items-center gap-2 font-mono font-bold text-[#2563EB] ${text}`}>
      <span className="relative inline-flex">
        <span className={`absolute inline-flex ${dot} animate-ping rounded-full bg-[#2563EB] opacity-30`} />
        <span className={`relative inline-flex ${dot} rounded-full bg-[#2563EB]`} />
      </span>
      OPEN
    </span>
  )
}

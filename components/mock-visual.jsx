'use client'

export default function MockVisual({ type }) {
  if (type === 'chat') {
    return (
      <div className="space-y-3">
        {['Yeni yorum', 'QR giriş', 'Canlı akış'].map((item, index) => (
          <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              <span className="text-xs text-slate-400">source_{index + 1}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'queue') {
    return (
      <div className="space-y-3">
        {[['Approve', 'cyan'], ['Review', 'violet'], ['Reject', 'slate']].map(([label, tone]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3">
            <div className="h-2 w-24 rounded-full bg-white/10" />
            <div
              className={`rounded-full px-3 py-1 text-[0.68rem] ${
                tone === 'cyan'
                  ? 'bg-cyan-400/10 text-cyan-200'
                  : tone === 'violet'
                    ? 'bg-violet-400/10 text-violet-200'
                    : 'bg-slate-400/10 text-slate-200'
              }`}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'onair') {
    return (
      <div className="rounded-[26px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_60%)] p-4">
        <div className="rounded-[22px] border border-white/8 bg-slate-950/55 p-4">
          <div className="label-ui text-[0.62rem] text-cyan-200">On Air Selected</div>
          <div className="mt-4 h-3 w-3/5 rounded-full bg-white/12" />
          <div className="mt-3 h-3 w-full rounded-full bg-white/10" />
          <div className="mt-2 h-3 w-4/5 rounded-full bg-white/10" />
        </div>
      </div>
    )
  }

  if (type === 'poll') {
    return (
      <div className="space-y-4">
        {[72, 54, 33].map((value) => (
          <div key={value}>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
              <span>Poll Option</span>
              <span>{value}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#60a5fa,#22d3ee,#8b5cf6)]"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'score') {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Feasibility', '82'],
          ['Market', '67'],
          ['Risk', '31'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-slate-950/55 p-3 text-center">
            <div className="text-[0.62rem] uppercase tracking-[0.16em] text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-2 w-28 rounded-full bg-white/12" />
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            <span className="h-2 w-2 rounded-full bg-violet-300" />
            <span className="h-2 w-2 rounded-full bg-sky-300" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-2xl bg-white/8" />
          <div className="h-16 rounded-2xl bg-white/8" />
        </div>
      </div>
    </div>
  )
}

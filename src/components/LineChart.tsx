import { useId, useState } from 'react'

export interface Series {
  name: string
  color: string
  values: number[]
  dashed?: boolean
  area?: boolean
}

interface Props {
  series: Series[]
  /** x-axis label for each index */
  xLabels: string[]
  /** optional marker per index, drawn as a dot on the baseline */
  markers?: number[]
  unit?: string
  height?: number
}

const W = 800
const PAD = { l: 44, r: 14, t: 14, b: 28 }

function niceMax(v: number) {
  if (v <= 0) return 10
  const pow = 10 ** Math.floor(Math.log10(v))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

export function LineChart({ series, xLabels, markers, unit = '', height = 240 }: Props) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const n = xLabels.length
  const H = height
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)))
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const x = (i: number) => PAD.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v: number) => PAD.t + ih - (v / max) * ih
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
  const everyN = Math.max(1, Math.ceil(n / 10))

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD.l) / iw) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Line chart of ${series.map((s) => s.name).join(' and ')}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s, k) => (
            <linearGradient key={k} id={`${id}-g${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="3 4" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--sub)">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {xLabels.map((l, i) =>
          i % everyN === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--sub)">
              {l}
            </text>
          ) : null,
        )}
        {series.map((s, k) =>
          s.area && n > 1 ? (
            <path
              key={`a${k}`}
              d={`${path(s.values)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`}
              fill={`url(#${id}-g${k})`}
            />
          ) : null,
        )}
        {series.map((s, k) => (
          <path
            key={k}
            d={path(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? '5 5' : undefined}
          />
        ))}
        {n === 1 &&
          series.map((s, k) => <circle key={k} cx={x(0)} cy={y(s.values[0])} r={4} fill={s.color} />)}
        {markers?.map((m, i) =>
          m > 0 ? (
            <g key={i}>
              <circle cx={x(i)} cy={y(0) - 6} r={3.5} fill="var(--bad)" />
              {m > 1 && (
                <text x={x(i)} y={y(0) - 14} textAnchor="middle" fontSize="10" fill="var(--bad)">
                  {m}
                </text>
              )}
            </g>
          ) : null,
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="var(--sub)" strokeOpacity="0.5" />
            {series.map((s, k) => (
              <circle key={k} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill="var(--bg)" stroke={s.color} strokeWidth={2.25} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-xl"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: hover > n / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }}
        >
          <div className="mb-1 text-sub">{xLabels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-sub">{s.name}</span>
              <span className="ml-auto pl-3 font-mono text-ink">
                {Math.round(s.values[hover])}
                {unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

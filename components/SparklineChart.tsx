interface SparklineChartProps {
  values: number[]
  color?: string
  className?: string
}

export default function SparklineChart({ values, color, className }: SparklineChartProps) {
  if (values.length < 2) {
    const c = color ?? '#10b981'
    return (
      <svg viewBox="0 0 200 36" preserveAspectRatio="none" className={className ?? 'w-full h-9'}>
        <line x1="0" y1="18" x2="200" y2="18" stroke={c} strokeWidth="1.5" opacity="0.3" />
      </svg>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 200
    const y = pad + ((1 - (v - min) / range) * (36 - pad * 2))
    return [x, y] as [number, number]
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L200,36 L0,36 Z`

  const trend = values[values.length - 1] >= values[0]
  const c = color ?? (trend ? '#10b981' : '#ef4444')

  return (
    <svg viewBox="0 0 200 36" preserveAspectRatio="none" className={className ?? 'w-full h-9'}>
      <defs>
        <linearGradient id={`spark-grad-${c.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.25" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-grad-${c.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

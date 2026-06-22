'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

export interface BenchmarkChartPoint {
  date: string
  portfolio: number
  sp500: number
}

interface Props {
  data: BenchmarkChartPoint[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
}

function formatPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function BenchmarkChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-fg-mute">
        Not enough data for this range. Try a wider time window.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 12%)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: 'hsl(240 4% 45%)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatPct}
          tick={{ fontSize: 11, fill: 'hsl(240 4% 45%)' }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <ReferenceLine y={0} stroke="hsl(240 4% 30%)" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{ background: 'hsl(235 9% 12%)', border: '1px solid hsl(240 6% 12%)', borderRadius: 8, fontSize: 12 }}
          labelFormatter={formatDate}
          formatter={(value: number, name: string) => [
            formatPct(value),
            name === 'portfolio' ? 'Portfolio' : 'S&P 500',
          ]}
        />
        <Line type="monotone" dataKey="sp500" stroke="hsl(240 4% 50%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

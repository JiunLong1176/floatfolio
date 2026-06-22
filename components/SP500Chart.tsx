'use client'

import { useId } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface Props {
  data: { date: string; close: number }[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
}

function fmtUSD(v: number) {
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export default function SP500Chart({ data }: Props) {
  const gradId = `grad-sp500-${useId().replace(/:/g, '')}`

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-fg-mute">
        Not enough data for this range.
      </div>
    )
  }

  const first = data[0].close
  const last  = data[data.length - 1].close
  const color = last >= first ? '#10b981' : '#ef4444'

  return (
    <ResponsiveContainer width="100%" height={192}>
      <AreaChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 12%)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmtUSD}
          tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }}
          axisLine={false}
          tickLine={false}
          width={72}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(235 9% 12%)', border: '1px solid hsl(240 6% 12%)', borderRadius: 8, fontSize: 12 }}
          labelFormatter={formatDate}
          formatter={(value: number) => [fmtUSD(value), 'S&P 500']}
        />
        <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

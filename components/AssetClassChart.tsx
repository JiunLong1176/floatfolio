'use client'

import { useId } from 'react'
import { useCurrency } from '@/contexts/currency'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { fmt } from '@/lib/utils'

interface DataPoint {
  date: string
  value_myr: number
  cost_myr: number
  value_usd: number
  cost_usd: number
}

interface Props {
  data: DataPoint[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
}

export default function AssetClassChart({ data }: Props) {
  const { currency } = useCurrency()
  const uid = useId().replace(/:/g, '')

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-fg-mute">
        Not enough data for this range.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    date: d.date,
    value: currency === 'MYR' ? d.value_myr : d.value_usd,
    cost: currency === 'MYR' ? d.cost_myr : d.cost_usd,
  }))

  const allPositive = chartData.every((d) => d.value >= d.cost)
  const color = allPositive ? '#10b981' : '#ef4444'
  const gradId = `grad-${uid}`

  return (
    <ResponsiveContainer width="100%" height={192}>
      <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
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
          tickFormatter={(v) => fmt(v, currency)}
          tick={{ fontSize: 10, fill: 'hsl(240 4% 45%)' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(235 9% 12%)', border: '1px solid hsl(240 6% 12%)', borderRadius: 8, fontSize: 12 }}
          labelFormatter={formatDate}
          formatter={(value: number, name: string) => [fmt(value, currency), name === 'value' ? 'Value' : 'Cost basis']}
        />
        <Area type="monotone" dataKey="cost" stroke="hsl(240 4% 45%)" strokeDasharray="4 4" strokeWidth={1} fill="none" dot={false} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line } from 'recharts';

const mockData = {
  campaignsOverTime: [
    { date: 'Jan', campaigns: 12 },
    { date: 'Feb', campaigns: 19 },
    { date: 'Mar', campaigns: 15 },
    { date: 'Apr', campaigns: 22 },
    { date: 'May', campaigns: 28 },
    { date: 'Jun', campaigns: 35 },
  ],
  providerUsage: [
    { name: 'Gemini', value: 45 },
    { name: 'DeepSeek', value: 30 },
    { name: 'GLM', value: 25 },
  ],
  toneDistribution: [
    { tone: 'Professional', count: 35 },
    { tone: 'Luxury', count: 20 },
    { tone: 'Casual', count: 25 },
    { tone: 'Urgent', count: 15 },
    { tone: 'Humorous', count: 5 },
  ],
};

const COLORS = ['#c8602a', '#2d7a4f', '#c88a2a', '#c83a2a', '#8b5cf6'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Track your campaign performance</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{ padding: '8px 16px', fontSize: 14 }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { icon: BarChart3, label: 'Total Campaigns', value: '156', color: 'var(--primary)' },
          { icon: TrendingUp, label: 'This Month', value: '35', color: 'var(--status-green)' },
          { icon: PieChart, label: 'AI Credits Used', value: '2,450', color: '#8b5cf6' },
          { icon: Calendar, label: 'Avg per Day', value: '5.2', color: 'var(--status-orange)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: `${stat.color}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{stat.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>Campaigns Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockData.campaignsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--ink-muted)" fontSize={12} />
              <YAxis stroke="var(--ink-muted)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="campaigns" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>AI Provider Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={mockData.providerUsage}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {mockData.providerUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
            {mockData.providerUsage.map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: COLORS[index % COLORS.length] }} />
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>Tone Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockData.toneDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--ink-muted)" fontSize={12} />
              <YAxis dataKey="tone" type="category" stroke="var(--ink-muted)" fontSize={12} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
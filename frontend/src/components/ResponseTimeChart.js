import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ResponseTimeChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No data yet</div>;
  }

  const labels = data.map((d) => formatTime(d.checked_at));
  const values = data.map((d) => d.response_time_ms);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `${Math.round(ctx.parsed.y)}ms`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#64748b',
          maxTicksLimit: 8,
          font: { size: 10 },
        },
        grid: { color: '#1e293b' },
      },
      y: {
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (v) => `${v}ms`,
        },
        grid: { color: '#1e293b' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

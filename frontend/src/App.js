import React from 'react';
import Dashboard from './components/Dashboard';

const styles = {
  header: {
    background: '#1e293b',
    padding: '16px 24px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f8fafc',
  },
  badge: {
    background: '#22c55e',
    color: '#052e16',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '999px',
    fontWeight: 600,
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
};

export default function App() {
  return (
    <div>
      <header style={styles.header}>
        <span style={styles.title}>Service Health Dashboard</span>
        <span style={styles.badge}>LIVE</span>
      </header>
      <main style={styles.main}>
        <Dashboard />
      </main>
    </div>
  );
}

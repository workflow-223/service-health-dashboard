import React from 'react';
import EndpointCard from './EndpointCard';

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: '#64748b',
    fontSize: '14px',
  },
};

export default function EndpointList({ endpoints, onRemove }) {
  if (endpoints.length === 0) {
    return (
      <div style={styles.empty}>
        No endpoints configured. Add one above to start monitoring.
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {endpoints.map((ep) => (
        <EndpointCard key={ep.id} endpoint={ep} onRemove={onRemove} />
      ))}
    </div>
  );
}

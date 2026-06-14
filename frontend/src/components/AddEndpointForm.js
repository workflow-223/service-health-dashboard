import React, { useState } from 'react';

const styles = {
  container: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #334155',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '12px',
  },
  row: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1 1 200px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  inputSmall: {
    width: '100px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default function AddEndpointForm({ onAdd }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [interval, setInterval] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !name) return;
    setLoading(true);
    await onAdd(url, name, interval);
    setUrl('');
    setName('');
    setInterval(60);
    setLoading(false);
  };

  return (
    <form style={styles.container} onSubmit={handleSubmit}>
      <div style={styles.title}>Add Endpoint</div>
      <div style={styles.row}>
        <input
          style={styles.input}
          placeholder="URL (e.g. https://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <input
          style={Object.assign({}, styles.input, { flex: '0 1 180px' })}
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          style={styles.inputSmall}
          type="number"
          placeholder="Interval (s)"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          min={10}
          max={3600}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}

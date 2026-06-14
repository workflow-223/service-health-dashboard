import React, { useState, useEffect, useRef } from 'react';
import ResponseTimeChart from './ResponseTimeChart';

const API = process.env.REACT_APP_API_URL || '';
const MAX_HISTORY = 60;

function formatTime(isoStr) {
  if (!isoStr) return 'Never';
  const d = new Date(isoStr);
  return d.toLocaleTimeString();
}

function ms(value) {
  if (value == null) return '-';
  return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
}

export default function EndpointCard({ endpoint, onRemove }) {
  const [history, setHistory] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const lastCheckedRef = useRef(null);
  const check = endpoint.latestCheck;
  const isUp = check ? check.is_up === 1 : null;
  const borderColor = isUp === null ? '#334155' : isUp ? '#22c55e' : '#ef4444';

  useEffect(() => {
    if (!showChart) return;
    let cancelled = false;
    fetch(`${API}/api/endpoints/${endpoint.id}/history?limit=${MAX_HISTORY}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          if (data.length > 0) {
            lastCheckedRef.current = data[data.length - 1].checked_at;
          }
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [endpoint.id, showChart]);

  useEffect(() => {
    if (!showChart || !check || !check.checked_at) return;
    if (check.checked_at === lastCheckedRef.current) return;
    lastCheckedRef.current = check.checked_at;
    setHistory((prev) => {
      const next = [...prev, {
        status_code: check.status_code,
        response_time_ms: check.response_time_ms,
        is_up: check.is_up,
        error: check.error,
        checked_at: check.checked_at,
      }];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
  }, [showChart, check]);

  const latestTime = history.length > 0 ? history[history.length - 1].response_time_ms : null;
  const avgTime = history.length > 0
    ? Math.round(history.reduce((s, h) => s + h.response_time_ms, 0) / history.length)
    : null;

  return (
    <div
      style={{
        background: '#1e293b',
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#f1f5f9' }}>
              {endpoint.name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>
              {endpoint.url}
            </div>
          </div>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isUp === null ? '#64748b' : isUp ? '#22c55e' : '#ef4444',
              flexShrink: 0,
              marginTop: '4px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>Response</div>
            <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
              {latestTime != null ? ms(latestTime) : (check ? ms(check.response_time_ms) : '-')}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>Avg (60)</div>
            <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{avgTime != null ? ms(avgTime) : '-'}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>Status</div>
            <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
              {check && check.status_code ? check.status_code : isUp === false ? 'ERR' : '-'}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>Last checked</div>
            <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{formatTime(check?.checked_at)}</div>
          </div>
        </div>

        {check && check.error && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#f87171' }}>
            {check.error}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #334155', display: 'flex' }}>
        <button
          onClick={() => setShowChart(!showChart)}
          style={{
            flex: 1,
            padding: '8px',
            background: 'none',
            border: 'none',
            color: showChart ? '#38bdf8' : '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
            borderRight: '1px solid #334155',
          }}
        >
          {showChart ? 'Hide Chart' : 'Show Chart'}
        </button>
        <button
          onClick={() => onRemove(endpoint.id)}
          style={{
            flex: 1,
            padding: '8px',
            background: 'none',
            border: 'none',
            color: '#f87171',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Remove
        </button>
      </div>

      {showChart && (
        <div style={{ borderTop: '1px solid #334155', padding: '16px' }}>
          <ResponseTimeChart data={history} />
        </div>
      )}
    </div>
  );
}

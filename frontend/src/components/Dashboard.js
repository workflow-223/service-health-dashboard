import React, { useState, useEffect, useCallback, useRef } from 'react';
import EndpointList from './EndpointList';
import AddEndpointForm from './AddEndpointForm';
import useWebSocket from '../hooks/useWebSocket';

const API = process.env.REACT_APP_API_URL || '';

export default function Dashboard() {
  const [endpoints, setEndpoints] = useState([]);
  const endpointsRef = useRef(endpoints);
  endpointsRef.current = endpoints;

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/endpoints`);
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
        endpointsRef.current = data;
      }
    } catch (err) {
      console.error('Failed to fetch endpoints:', err);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'check_results') {
      setEndpoints((prev) =>
        prev.map((ep) => {
          const update = msg.data.find((r) => r.endpointId === ep.id);
          if (update) {
            return {
              ...ep,
              latestCheck: {
                status_code: update.statusCode,
                response_time_ms: update.responseTimeMs,
                is_up: update.isUp ? 1 : 0,
                error: update.error,
                checked_at: new Date().toISOString(),
              },
            };
          }
          return ep;
        })
      );
    }
    if (msg.type === 'endpoint_added') {
      setEndpoints((prev) => {
        if (prev.some((ep) => ep.id === msg.data.id)) return prev;
        return [msg.data, ...prev];
      });
    }
    if (msg.type === 'endpoint_removed') {
      setEndpoints((prev) => prev.filter((ep) => ep.id !== msg.data.id));
    }
  }, []);

  useWebSocket(handleMessage);

  const handleAdd = async (url, name, interval) => {
    try {
      const res = await fetch(`${API}/api/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to add endpoint');
        return;
      }
      setEndpoints((prev) => {
        if (prev.some((ep) => ep.id === data.id)) return prev;
        return [data, ...prev];
      });
    } catch (err) {
      alert('Failed to add endpoint: ' + err.message);
    }
  };

  const handleRemove = async (id) => {
    const prev = endpointsRef.current;
    setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    try {
      const res = await fetch(`${API}/api/endpoints/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setEndpoints(prev);
        alert('Failed to remove endpoint');
      }
    } catch (err) {
      setEndpoints(prev);
      alert('Failed to remove endpoint: ' + err.message);
    }
  };

  return (
    <div>
      <AddEndpointForm onAdd={handleAdd} />
      <EndpointList endpoints={endpoints} onRemove={handleRemove} />
    </div>
  );
}

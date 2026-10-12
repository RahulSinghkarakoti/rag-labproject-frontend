'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SSEStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

interface UseSSEOptions {
  url: string;
  enabled?: boolean;
  eventNames?: string[];
}

function parseSSEPayload<T>(payload: string): T {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return payload as unknown as T;
  }
}

export function useSSE<T = any>({ url, enabled = true, eventNames = ['message'] }: UseSSEOptions) {
  const [data, setData] = useState<T | null>(null);
  const [messages, setMessages] = useState<T[]>([]);
  const [status, setStatus] = useState<SSEStatus>('DISCONNECTED');
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('CONNECTING');
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    const handleMessage = (event: MessageEvent) => {
      const parsed = parseSSEPayload<T>(event.data);
      setData(parsed);
      setMessages((prev) => [...prev, parsed]);
    };

    es.onopen = () => setStatus('CONNECTED');
    es.onmessage = handleMessage;

    for (const eventName of eventNames) {
      if (eventName === 'message') continue;
      es.addEventListener(eventName, (event) => {
        const messageEvent = event as MessageEvent;
        handleMessage(messageEvent);
      });
    }

    es.onerror = (err) => {
      console.error('SSE Connection Error:', err);
      setStatus('DISCONNECTED');
      es.close();
      eventSourceRef.current = null;
    };
  }, [url, enabled, eventNames]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus('DISCONNECTED');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { data, messages, status, reconnect: connect, disconnect };
}
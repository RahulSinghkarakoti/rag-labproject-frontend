'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getCachedSession } from '@/lib/api';

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
  const abortCtrlRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const connect = useCallback(async () => {
    if (!enabled || typeof window === 'undefined') return;

    stoppedRef.current = false;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
    }

    setStatus('CONNECTING');
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    const session = await getCachedSession();
    if (stoppedRef.current) return;
    if (!session?.accessToken) {
      setStatus('DISCONNECTED');
      return;
    }

    try {
      await fetchEventSource(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          Authorization: `Bearer ${session.accessToken}`,
        },
        signal: ctrl.signal,
        async onopen(response) {
          if (response.ok) {
            setStatus('CONNECTED');
          } else {
            if (response.status === 401 || response.status === 403) {
              await getCachedSession(true);
            }
            throw new Error(`Connection failed (${response.status})`);
          }
        },
        onmessage(msg) {
          if (eventNames.includes(msg.event) || (msg.event === '' && eventNames.includes('message'))) {
            const envelope = parseSSEPayload<{ data?: string | T }>(msg.data);
            const parsed =
              envelope && typeof envelope === 'object' && 'data' in envelope
                ? parseSSEPayload<T>(envelope.data as string)
                : (envelope as T);
            setData(parsed);
            setMessages((prev) => [...prev, parsed]);
          }
        },
        onclose() {
          throw new Error('Connection closed');
        },
        onerror(err) {
          console.error('SSE Connection Error:', err);
          setStatus('DISCONNECTED');
          if (!stoppedRef.current && !retryTimerRef.current) {
            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;
              connect();
            }, 1000);
          }
          throw err;
        }
      });
    } catch (err) {
      // Handled in onerror
    }
  }, [url, enabled, eventNames]);

  const disconnect = useCallback(() => {
    stoppedRef.current = true;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
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

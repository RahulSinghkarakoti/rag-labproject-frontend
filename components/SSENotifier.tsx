'use client';

import { useSSE } from '@/app/hooks/useSSE';

interface SSEMessagePayload {
  message?: string;
  doc_id?: string;
  status?: string;
  progress?: number;
}

export default function SSENotifier() {
  const { messages, status, reconnect, disconnect } = useSSE<SSEMessagePayload>({
    url: 'http://localhost:8000/api/v1/sse/stream',
    eventNames: ['ingestion_status', 'document_upload_status', 'notification'],
  });

  return (
    <div className="p-6 max-w-xl mx-auto border rounded-xl shadow-sm bg-white text-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Real-time Stream</h2>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            status === 'CONNECTED'
              ? 'bg-green-100 text-green-800'
              : status === 'CONNECTING'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={reconnect}
          disabled={status === 'CONNECTED'}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Reconnect
        </button>
        <button
          onClick={disconnect}
          disabled={status === 'DISCONNECTED'}
          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
        {messages.length === 0 ? (
          <p className="text-gray-400 italic">Listening for events...</p>
        ) : (
          messages.map((item, idx) => (
            <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-none">
              <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
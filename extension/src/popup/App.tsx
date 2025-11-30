import React, { useState } from 'react';
import { defaultFilename } from '@/shared/services/snapshot';
import ImportControl from './components/ImportControl';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [filename, setFilename] = useState(defaultFilename());

  const handleImportStatus = (newStatus: Status, newMessage: string) => {
    setStatus(newStatus);
    setMessage(newMessage);
  };

  const handleExport = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_SNAPSHOT',
        filename,
      });

      if (response?.error) {
        setStatus('error');
        setMessage(response.error);
      } else {
        setStatus('success');
        setMessage(`Exported ${response.totalTabs} tabs to ${response.filename}`);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <main className="popup-container">
      <h1 className="popup-title">Tab Snapshot</h1>

      <label className="input-label">
        Filename
        <input
          type="text"
          className="filename-input"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          disabled={status === 'loading'}
        />
      </label>

      <button
        className="export-btn"
        onClick={handleExport}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Exporting…' : 'Export Tabs'}
      </button>

      <ImportControl onStatusChange={handleImportStatus} />

      {message && (
        <p className={`toast ${status === 'error' ? 'toast-error' : 'toast-success'}`}>
          {message}
        </p>
      )}
    </main>
  );
}

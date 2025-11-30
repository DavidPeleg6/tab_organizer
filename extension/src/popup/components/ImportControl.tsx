import React, { useRef, useState } from 'react';
import { TabSnapshotSchema, TabSnapshot } from '@/shared/schema';

interface ImportControlProps {
  onStatusChange: (status: 'idle' | 'loading' | 'success' | 'error', message: string) => void;
}

export default function ImportControl({ onStatusChange }: ImportControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    onStatusChange('loading', 'Reading file…');

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Validate with Zod
      const result = TabSnapshotSchema.safeParse(json);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.message).join('; ');
        throw new Error(`Invalid snapshot: ${issues}`);
      }

      const snapshot: TabSnapshot = result.data;

      // Send to background for restoration
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_SNAPSHOT',
        snapshot,
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      onStatusChange(
        'success',
        `Restored ${response.restoredTabs} tabs across ${response.restoredWindows} windows.`
      );
    } catch (err) {
      onStatusChange('error', err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
      // Reset input so same file can be selected again
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="import-control">
      <label className="import-btn">
        {loading ? 'Importing…' : 'Import Snapshot'}
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          disabled={loading}
          hidden
        />
      </label>
    </div>
  );
}


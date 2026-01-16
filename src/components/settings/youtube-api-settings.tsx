import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';

export default function YouTubeApiSettings() {
  const apiKey = useAppStore(s => s.youtubeApiKey);
  const setApiKey = useAppStore(s => s.setYoutubeApiKey);
  const [input, setInput] = useState(apiKey || '');
  const [show, setShow] = useState(false);

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="font-bold mb-2">YouTube API Key</h2>
      <div className="flex items-center gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={input}
          onChange={e => setInput(e.target.value)}
          className="border px-2 py-1 rounded w-64"
          placeholder="Enter your YouTube API key"
        />
        <button
          className="px-2 py-1 text-xs border rounded"
          onClick={() => setShow(s => !s)}
        >{show ? 'Hide' : 'Show'}</button>
        <button
          className="px-2 py-1 text-xs border rounded bg-blue-500 text-white"
          onClick={() => setApiKey(input)}
        >Save</button>
      </div>
      {apiKey && (
        <div className="mt-2 text-xs text-gray-500">
          Key is saved. Most of it is hidden for security.
        </div>
      )}
    </div>
  );
}

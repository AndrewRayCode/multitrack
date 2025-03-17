'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Song {
  id: string;
  name: string;
  bpm: number;
  numberOfBars: number;
  tracks: any[];
  createdAt: string;
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    fetch('/api/songs')
      .then((res) => res.json())
      .then((data) => setSongs(data))
      .catch((error) => console.error('Error fetching songs:', error));
  }, []);

  const deleteSong = async (id: string) => {
    if (!confirm('Are you sure you want to delete this song?')) {
      return;
    }

    try {
      const response = await fetch(`/api/songs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete song');
      }

      setSongs(songs.filter((song) => song.id !== id));
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Failed to delete song');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold">Your Songs</h1>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-b from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all font-bold uppercase tracking-wider shadow-lg border border-blue-500 active:shadow-inner active:translate-y-px hover:shadow-blue-500/25 hover:-translate-y-0.5"
          >
            Create New Song
          </Link>
        </div>

        <div className="grid gap-4">
          {songs.map((song) => (
            <div
              key={song.id}
              className="p-6 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/songs/${song.id}`}
                    className="text-xl font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {song.name}
                  </Link>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{song.bpm} BPM</span>
                    <span>{song.numberOfBars} bars</span>
                    <span>{song.tracks.length} tracks</span>
                    <span>
                      Created {new Date(song.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/songs/${song.id}`}
                    className="px-4 py-2 bg-gradient-to-b from-blue-600 to-blue-700 text-white rounded hover:from-blue-500 hover:to-blue-600 transition-all shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5 active:shadow-inner active:translate-y-px border border-blue-500"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => deleteSong(song.id)}
                    className="px-4 py-2 bg-gradient-to-b from-red-600 to-red-700 text-white rounded hover:from-red-500 hover:to-red-600 transition-all shadow-md hover:shadow-red-500/25 hover:-translate-y-0.5 active:shadow-inner active:translate-y-px border border-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {songs.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">No songs yet.</p>
              <p className="mt-2">Create your first song to get started!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

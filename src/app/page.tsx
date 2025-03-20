'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserId } from '@/lib/userId';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState(120);
  const [numberOfBars, setNumberOfBars] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const userId = getUserId();
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bpm,
          numberOfBars,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create song');
      }

      const song = await response.json();
      router.push(`/songs/${song.id}`);
    } catch (error) {
      console.error('Error creating song:', error);
      setError('Failed to create song. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border dark:border-gray-700 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/10 dark:from-transparent dark:via-white/5 dark:to-white/10 rounded-lg pointer-events-none"></div>
          <form onSubmit={createSong} className="space-y-6 relative">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Song Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all shadow-inner"
                required
                minLength={1}
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bpm" className="block text-sm font-medium mb-2">
                  Tempo (BPM)
                </label>
                <input
                  type="number"
                  id="bpm"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all shadow-inner"
                  required
                  min={30}
                  max={300}
                />
              </div>

              <div>
                <label
                  htmlFor="bars"
                  className="block text-sm font-medium mb-2"
                >
                  Number of Bars
                </label>
                <input
                  type="number"
                  id="bars"
                  value={numberOfBars}
                  onChange={(e) => setNumberOfBars(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all shadow-inner"
                  required
                  min={1}
                  max={4}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full px-6 py-3 bg-gradient-to-b from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all font-bold uppercase tracking-wider shadow-lg border border-blue-500 active:shadow-inner active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              {isCreating ? 'Creating...' : 'Create Song'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

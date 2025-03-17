'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [songName, setSongName] = useState('');
  const [bpm, setBpm] = useState(120);
  const [numberOfBars, setNumberOfBars] = useState(4);
  const router = useRouter();

  const createSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songName.trim()) return;

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: songName,
          bpm,
          numberOfBars: Math.min(4, Math.max(1, numberOfBars)),
        }),
      });

      const song = await response.json();
      if (song.id) {
        router.push(`/songs/${song.id}`);
      }
    } catch (error) {
      console.error('Error creating song:', error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Multitrack Recorder</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Song</h2>
          <form onSubmit={createSong} className="space-y-4">
            <div>
              <label
                htmlFor="songName"
                className="block text-sm font-medium mb-1"
              >
                Song Name
              </label>
              <input
                id="songName"
                type="text"
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                placeholder="Enter song name"
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="bpm" className="block text-sm font-medium mb-1">
                  BPM
                </label>
                <input
                  id="bpm"
                  type="number"
                  min="30"
                  max="300"
                  value={bpm}
                  onChange={(e) =>
                    setBpm(
                      Math.max(
                        30,
                        Math.min(300, parseInt(e.target.value) || 120)
                      )
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="numberOfBars"
                  className="block text-sm font-medium mb-1"
                >
                  Number of Bars (max 4)
                </label>
                <input
                  id="numberOfBars"
                  type="number"
                  min="1"
                  max="4"
                  value={numberOfBars}
                  onChange={(e) =>
                    setNumberOfBars(
                      Math.max(1, Math.min(4, parseInt(e.target.value) || 4))
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Recent Songs</h2>
          <SongList />
        </div>
      </main>
    </div>
  );
}

function SongList() {
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/songs')
      .then((res) => res.json())
      .then((data) => setSongs(data))
      .catch((error) => console.error('Error fetching songs:', error));
  }, []);

  return (
    <div className="space-y-4">
      {songs.map((song) => (
        <Link
          key={song.id}
          href={`/songs/${song.id}`}
          className="block p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-semibold">{song.name}</h3>
          <p className="text-sm text-gray-500">
            {song.tracks.length} tracks • Created{' '}
            {new Date(song.createdAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
      {songs.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          No songs yet. Create one above!
        </p>
      )}
    </div>
  );
}

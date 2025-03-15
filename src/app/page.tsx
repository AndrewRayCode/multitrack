'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [songName, setSongName] = useState('')
  const router = useRouter()

  const createSong = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!songName.trim()) return

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: songName }),
      })

      const song = await response.json()
      if (song.id) {
        router.push(`/songs/${song.id}`)
      }
    } catch (error) {
      console.error('Error creating song:', error)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Multitrack Recorder</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create New Song</h2>
          <form onSubmit={createSong} className="flex gap-4">
            <input
              type="text"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              placeholder="Enter song name"
              className="flex-1 px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
  )
}

function SongList() {
  const [songs, setSongs] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/songs')
      .then((res) => res.json())
      .then((data) => setSongs(data))
      .catch((error) => console.error('Error fetching songs:', error))
  }, [])

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
        <p className="text-gray-500 text-center py-4">No songs yet. Create one above!</p>
      )}
    </div>
  )
}

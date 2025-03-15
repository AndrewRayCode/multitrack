'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import WaveSurfer from 'wavesurfer.js'

interface Track {
  id: string
  audioUrl: string
  createdAt: string
}

interface Song {
  id: string
  name: string
  tracks: Track[]
  createdAt: string
}

export default function SongPage() {
  const params = useParams()
  const [song, setSong] = useState<Song | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([])

  useEffect(() => {
    fetch(`/api/songs/${params.id}`)
      .then((res) => res.json())
      .then((data) => setSong(data))
      .catch((error) => console.error('Error fetching song:', error))
  }, [params.id])

  const startRecording = async () => {
    try {
      // Request microphone access with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create recorder with specific MIME type and bitrate
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        await uploadTrack(audioBlob)
        setAudioChunks([])
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      }

      setMediaRecorder(recorder)
      recorder.start(1000) // Collect data every second
      setIsRecording(true)
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      let errorMessage = 'Error accessing microphone. ';
      
      if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please ensure a microphone is connected and allowed.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage += 'Microphone access was denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use by another application.';
      }
      
      alert(errorMessage);
      setIsRecording(false);
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const uploadTrack = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('songId', params.id as string)

      const response = await fetch('/api/tracks', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        // Refresh song data to show new track
        const updatedSong = await fetch(`/api/songs/${params.id}`).then((res) =>
          res.json()
        )
        setSong(updatedSong)
      }
    } catch (error) {
      console.error('Error uploading track:', error)
    }
  }

  const playAllTracks = async () => {
    if (!song?.tracks.length) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const ctx = audioContextRef.current
      setIsPlaying(true)

      // Stop any currently playing sources
      audioSourcesRef.current.forEach((source) => {
        try {
          source.stop()
        } catch (e) {
          // Ignore if already stopped
        }
      })
      audioSourcesRef.current = []

      // Load and play all tracks
      const playPromises = song.tracks.map(async (track) => {
        const response = await fetch(track.audioUrl)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)
        audioSourcesRef.current.push(source)
        
        source.start(0)
        source.onended = () => {
          const index = audioSourcesRef.current.indexOf(source)
          if (index > -1) {
            audioSourcesRef.current.splice(index, 1)
          }
          if (audioSourcesRef.current.length === 0) {
            setIsPlaying(false)
          }
        }
      })

      await Promise.all(playPromises)
    } catch (error) {
      console.error('Error playing tracks:', error)
      setIsPlaying(false)
    }
  }

  const stopAllTracks = () => {
    audioSourcesRef.current.forEach((source) => {
      try {
        source.stop()
      } catch (e) {
        // Ignore if already stopped
      }
    })
    audioSourcesRef.current = []
    setIsPlaying(false)
  }

  if (!song) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to songs
          </Link>
          <h1 className="text-4xl font-bold">{song.name}</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Tracks</h2>
            <div className="flex gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Stop Recording
                </button>
              )}
              {song.tracks.length > 0 && (
                <button
                  onClick={isPlaying ? stopAllTracks : playAllTracks}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? 'Stop' : 'Play All'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {song.tracks.map((track) => (
              <div
                key={track.id}
                className="p-4 rounded-lg border dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Added {new Date(track.createdAt).toLocaleString()}
                  </p>
                  <audio src={track.audioUrl} controls className="w-64" />
                </div>
              </div>
            ))}
            {song.tracks.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No tracks yet. Start recording to add one!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 
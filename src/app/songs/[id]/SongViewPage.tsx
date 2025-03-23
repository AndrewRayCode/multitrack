'use client';

import { Song, Track } from '@prisma/client';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { getUserId } from '@/lib/userId';

interface SongViewPageProps {
  song: Omit<Song, 'editToken'> & {
    tracks: Track[];
  };
}

export default function SongViewPage({ song }: SongViewPageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [editToken, setEditToken] = useState<string | null>(null);
  const wavesurfers = useRef<WaveSurfer[]>([]);
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [showCopied, setShowCopied] = useState<'view' | 'edit' | null>(null);
  const isCreator = song.userId === getUserId();

  // Fetch edit token if user is creator
  useEffect(() => {
    if (isCreator) {
      fetch(`/api/songs/${song.id}/edit-token?userId=${getUserId()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.editToken) {
            setEditToken(data.editToken);
          }
        })
        .catch((error) => {
          console.error('Error fetching edit token:', error);
        });
    }
  }, [song.id, isCreator]);

  useEffect(() => {
    // Initialize WaveSurfer instances for each track
    song.tracks.forEach((track, index) => {
      const wavesurfer = WaveSurfer.create({
        container: containerRefs.current[index]!,
        waveColor: '#4a5568',
        progressColor: '#2b6cb0',
        cursorColor: '#2b6cb0',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 80,
        barGap: 2,
      });

      wavesurfer.load(track.audioUrl);
      wavesurfers.current[index] = wavesurfer;

      wavesurfer.on('ready', () => {
        wavesurfer.setTime(0);
      });

      wavesurfer.on('timeupdate', (time) => {
        setCurrentTime(time);
      });
    });

    return () => {
      wavesurfers.current.forEach((ws) => ws?.destroy());
    };
  }, [song.tracks]);

  const togglePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    wavesurfers.current.forEach((ws) => {
      if (newIsPlaying) {
        ws?.play();
      } else {
        ws?.pause();
      }
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (type: 'view' | 'edit') => {
    const baseUrl = window.location.origin;
    const url =
      type === 'view'
        ? `${baseUrl}/songs/${song.id}`
        : `${baseUrl}/songs/${song.id}/edit?token=${editToken}`;

    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(type);
      setTimeout(() => setShowCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{song.name}</h1>
        <div className="text-gray-600">
          <p>BPM: {song.bpm}</p>
          <p>Bars: {song.numberOfBars}</p>
        </div>

        {isCreator && editToken && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Share Your Song</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  View-only link (anyone can listen):
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard('view')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {showCopied === 'view' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Edit link (can add tracks):
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard('edit')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    {showCopied === 'edit' ? 'Copied!' : 'Copy Edit Link'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Only share the edit link with people you want to collaborate
                  with.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={togglePlayPause}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="text-gray-600">{formatTime(currentTime)}</span>
        </div>

        {song.tracks.map((track, index) => (
          <div key={track.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="mb-2">
              <h3 className="text-lg font-semibold">Track {index + 1}</h3>
            </div>
            <div
              ref={(el) => {
                containerRefs.current[index] = el;
              }}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

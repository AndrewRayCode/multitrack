'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import WaveSurfer from 'wavesurfer.js';

interface Track {
  id: string;
  audioUrl: string;
  createdAt: string;
}

interface Song {
  id: string;
  name: string;
  bpm: number;
  numberOfBars: number;
  tracks: Track[];
  createdAt: string;
}

export default function SongPage() {
  const params = useParams();
  const [song, setSong] = useState<Song | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const audioLevelRef = useRef(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countIn, setCountIn] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const metronomeIntervalRef = useRef<number | null>(null);
  const countInTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeBufferRef = useRef<AudioBuffer | null>(null);
  const metronomeContext = useRef<AudioContext | null>(null);
  const metronomeGainRef = useRef<GainNode | null>(null);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRecording) {
      setRecordingTime(0);
      intervalId = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    fetch(`/api/songs/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSong(data);
      })
      .catch((error) => console.error('Error fetching song:', error));
  }, [params.id]);

  // Load metronome sound file once
  useEffect(() => {
    const loadMetronome = async () => {
      try {
        const response = await fetch('/metronome.mp3');
        const arrayBuffer = await response.arrayBuffer();

        // Create a temporary context just for decoding
        metronomeContext.current = new AudioContext();
        metronomeBufferRef.current =
          await metronomeContext.current.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error('Error loading metronome sound:', error);
      }
    };

    loadMetronome();
  }, []);

  const updateAudioLevel = () => {
    if (!analyserRef.current || !isRecordingRef.current) {
      return;
    }

    const dataArray = dataArrayRef.current!;
    analyserRef.current.getByteFrequencyData(dataArray);

    const bufferLength = analyserRef.current.frequencyBinCount;

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Convert to percentage (0-100)
    const volumePercentage = Math.min(average * 1.5, 100);

    // Apply smoothing with previous value
    const smoothing = 0.2; // Higher = smoother, but less responsive
    audioLevelRef.current =
      audioLevelRef.current * smoothing +
      (volumePercentage / 30) * (1 - smoothing);

    // Update state for UI rendering
    setAudioLevel(audioLevelRef.current);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const playMetronomeClick = () => {
    if (!metronomeContext.current || !metronomeBufferRef.current) return;

    // Create gain node if it doesn't exist
    if (!metronomeGainRef.current) {
      metronomeGainRef.current = metronomeContext.current.createGain();
      metronomeGainRef.current.gain.value = 0.2; // Set volume to 20%
      metronomeGainRef.current.connect(metronomeContext.current.destination);
    }

    const source = metronomeContext.current.createBufferSource();
    source.buffer = metronomeBufferRef.current;
    source.connect(metronomeGainRef.current);
    source.start();
  };

  const startCountIn = async () => {
    if (!song) return;

    // Create AudioContext early
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    // Ensure AudioContext is running
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const beatInterval = (60 / song.bpm) * 1000;
    setCountIn(4);

    // Schedule the count-in clicks
    for (let i = 4; i > 0; i--) {
      countInTimeoutRef.current = setTimeout(() => {
        setCountIn(i - 1);
        playMetronomeClick();
        if (i === 1) {
          startRecording();
        }
      }, (4 - i) * beatInterval);
    }
  };

  const startRecording = async () => {
    if (!song) return;

    try {
      setErrorMessage(null);
      setAudioChunks([]);
      audioChunksRef.current = [];
      dataArrayRef.current = null;
      audioLevelRef.current = 0;
      setAudioLevel(0);

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Ensure recording AudioContext is in running state
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Start metronome if BPM is set
      if (song.bpm > 0) {
        const intervalMs = (60 / song.bpm) * 1000;
        playMetronomeClick(); // Play first click immediately
        metronomeIntervalRef.current = window.setInterval(
          playMetronomeClick,
          intervalMs
        );
      }

      // Request microphone access with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create and configure analyser node
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Create source from microphone stream and connect to analyser
      const micSource = audioContextRef.current.createMediaStreamSource(stream);
      micSource.connect(analyser);

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };

      recorder.onstop = async () => {
        const currentChunks = audioChunksRef.current;
        if (currentChunks.length === 0) {
          setErrorMessage(
            'No audio data recorded. Please try recording again.'
          );
          return;
        }

        // Stop metronome
        if (metronomeIntervalRef.current) {
          clearInterval(metronomeIntervalRef.current);
          metronomeIntervalRef.current = null;
        }

        const audioBlob = new Blob(currentChunks, { type: 'audio/webm' });
        await uploadTrack(audioBlob);
        setAudioChunks([]);
        audioChunksRef.current = [];
        setRecordingTime(0);
        audioLevelRef.current = 0;
        setAudioLevel(0);

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        micSource.disconnect();
        analyser.disconnect();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        audioContextRef.current?.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        isRecordingRef.current = false;
      };

      mediaRecorder.current = recorder;
      recorder.start(); // Collect data every second
      setIsRecording(true);
      isRecordingRef.current = true;
      updateAudioLevel();
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      let errorMessage = 'Error accessing microphone. ';

      if (error.name === 'NotFoundError') {
        errorMessage +=
          'No microphone found. Please ensure a microphone is connected and allowed.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage +=
          'Microphone access was denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use by another application.';
      }

      setErrorMessage(errorMessage);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
    }

    // Clear any remaining count-in timeouts
    if (countInTimeoutRef.current) {
      clearTimeout(countInTimeoutRef.current);
      countInTimeoutRef.current = null;
    }

    // Clean up metronome
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }

    // Clean up metronome gain
    if (metronomeGainRef.current) {
      metronomeGainRef.current.disconnect();
      metronomeGainRef.current = null;
    }

    setCountIn(0);
  };

  const uploadTrack = async (audioBlob: Blob) => {
    try {
      // Check if the audio blob is empty
      if (audioBlob.size === 0) {
        setErrorMessage('No audio recorded. Please try recording again.');
        return;
      }

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('songId', params.id as string);

      console.log('posting /api/tracks');
      const response = await fetch('/api/tracks', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload track');
      }

      // Refresh song data to show new track
      const updatedSong = await fetch(`/api/songs/${params.id}`).then((res) =>
        res.json()
      );
      setSong(updatedSong);
    } catch (error) {
      console.error('Error uploading track:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Error uploading track'
      );
    }
  };

  const playAllTracks = async () => {
    if (!song?.tracks.length) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      setIsPlaying(true);

      // Stop any currently playing sources
      audioSourcesRef.current.forEach((source) => {
        try {
          source.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      });
      audioSourcesRef.current = [];

      // Load and play all tracks
      const playPromises = song.tracks.map(async (track) => {
        const response = await fetch(track.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        audioSourcesRef.current.push(source);

        source.start(0);
        source.onended = () => {
          const index = audioSourcesRef.current.indexOf(source);
          if (index > -1) {
            audioSourcesRef.current.splice(index, 1);
          }
          if (audioSourcesRef.current.length === 0) {
            setIsPlaying(false);
          }
        };
      });

      await Promise.all(playPromises);
    } catch (error) {
      console.error('Error playing tracks:', error);
      setIsPlaying(false);
    }
  };

  const stopAllTracks = () => {
    audioSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    audioSourcesRef.current = [];
    setIsPlaying(false);
  };

  const deleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete track');
      }

      // Refresh song data to update the tracks list
      const updatedSong = await fetch(`/api/songs/${params.id}`).then((res) =>
        res.json()
      );
      setSong(updatedSong);
    } catch (error) {
      console.error('Error deleting track:', error);
      alert(error instanceof Error ? error.message : 'Error deleting track');
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  if (!song) {
    return <div className="p-8">Loading...</div>;
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

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">Tracks</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">BPM: {song.bpm}</span>
                <span className="text-sm font-medium">
                  Bars: {song.numberOfBars}
                </span>
              </div>
              {countIn > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {countIn}
                  </span>
                </div>
              )}
              {isRecording && (
                <div className="flex items-center gap-4">
                  <span className="text-red-500 font-mono">
                    {formatTime(recordingTime)}
                  </span>
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-100"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              {!isRecording && countIn === 0 ? (
                <button
                  onClick={startCountIn}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={countIn > 0}
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
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                      Added {new Date(track.createdAt).toLocaleString()}
                    </p>
                    <button
                      onClick={() => deleteTrack(track.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="Delete track"
                    >
                      Delete
                    </button>
                  </div>
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
  );
}

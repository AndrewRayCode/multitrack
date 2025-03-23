import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import SongPageClient from '../SongPageClient';
import { USER_ID_KEY } from '@/lib/userId';
import { cookies } from 'next/headers';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const song = await prisma.song.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!song) {
    return {
      title: 'Song Not Found - Multitrack Recorder',
    };
  }

  return {
    title: `Edit ${song.name} - Multitrack Recorder`,
    description: `Create awesome music with your friends!`,
    openGraph: {
      title: `Edit ${song.name} - Multitrack Recorder`,
      description: `Create awesome music with your friends!`,
      type: 'music.song',
    },
    twitter: {
      card: 'summary',
      title: `Edit ${song.name} - Multitrack Recorder`,
      description: `Create awesome music with your friends!`,
    },
  };
}

export default async function EditSongPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4">
          Please use the edit link provided by the song creator.
        </p>
      </div>
    );
  }
  // Get the user ID from cookies on the server side
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_ID_KEY)?.value || '';

  // Fetch the song data without the editToken
  const song = await prisma.song.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bpm: true,
      numberOfBars: true,
      editToken: true,
      userId: true,
      tracks: {
        select: {
          id: true,
          audioUrl: true,
          userId: true,
          createdAt: true,
          songId: true,
        },
      },
      createdAt: true,
    },
  });

  if (!song) {
    notFound();
  }

  const isUserCreator = song.userId === userId;
  return (
    <SongPageClient
      type="edit"
      song={{
        ...song,
        isUserCreator,
      }}
    />
  );
}

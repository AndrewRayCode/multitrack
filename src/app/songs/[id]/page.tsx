import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import SongPageClient from './SongPageClient';
import { cookies } from 'next/headers';
import { USER_ID_KEY } from '@/lib/userId';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
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
    title: `${song.name} - Multitrack Recorder`,
    description: `Listen to this awesome song!`,
    openGraph: {
      title: `${song.name} - Multitrack Recorder`,
      description: `Listen to this awesome song!`,
      type: 'music.song',
    },
    twitter: {
      card: 'summary',
      title: `${song.name} - Multitrack Recorder`,
      description: `Listen to this awesome song!`,
    },
  };
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      type="view"
      song={{
        ...song,
        isUserCreator,
        editToken: isUserCreator ? song.editToken : undefined,
      }}
    />
  );
}

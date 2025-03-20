import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import SongPageClient from './SongPageClient';

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
    description: `Create garbage songs with your friends!`,
    openGraph: {
      title: `${song.name} - Multitrack Recorder`,
      description: `Create garbage songs with your friends!`,
      type: 'music.song',
    },
    twitter: {
      card: 'summary',
      title: `${song.name} - Multitrack Recorder`,
      description: `Create garbage songs with your friends!`,
    },
  };
}

export default function SongPage() {
  return <SongPageClient />;
}

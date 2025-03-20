import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import SongPageClient from './SongPageClient';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const song = await prisma.song.findUnique({
    where: { id: params.id },
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

export default function SongPage({ params }: { params: { id: string } }) {
  return <SongPageClient />;
}

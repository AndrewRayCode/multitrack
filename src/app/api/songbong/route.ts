import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const g = url.searchParams.get('g');

    if (g !== process.env.MAGIC_POTATO) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const songs = await prisma.song.findMany({
      include: {
        tracks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(songs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching songs' },
      { status: 400 }
    );
  }
}

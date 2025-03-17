import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const song = await prisma.song.create({
      data: {
        name: json.name,
        bpm: Math.max(30, Math.min(300, json.bpm || 120)),
        numberOfBars: Math.max(1, Math.min(4, json.numberOfBars || 4)),
      },
    });
    return NextResponse.json(song);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating song' }, { status: 500 });
  }
}

export async function GET() {
  try {
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
      { status: 500 }
    );
  }
}

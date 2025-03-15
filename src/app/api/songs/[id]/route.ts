import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const song = await prisma.song.findUnique({
      where: {
        id: params.id,
      },
      include: {
        tracks: true,
      },
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(song)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching song' },
      { status: 500 }
    )
  }
} 
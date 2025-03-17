import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const song = await prisma.song.findUnique({
      where: {
        id,
      },
      include: {
        tracks: true,
      },
    });

    if (!song) {
      return new Response(JSON.stringify({ error: 'Song not found' }), {
        status: 404,
      });
    }

    return Response.json(song);
  } catch (error) {
    console.error('Error fetching song:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch song' }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.song.delete({
      where: {
        id,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting song:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete song' }), {
      status: 500,
    });
  }
}

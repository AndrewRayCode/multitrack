import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const song = await prisma.song.findUnique({
      where: {
        id,
        userId, // Only return the token if the user is the creator
      },
      select: {
        editToken: true,
      },
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Not authorized to get edit token' },
        { status: 403 }
      );
    }

    return NextResponse.json({ editToken: song.editToken });
  } catch (error) {
    console.error('Error fetching edit token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edit token' },
      { status: 500 }
    );
  }
}

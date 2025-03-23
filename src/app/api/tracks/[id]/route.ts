import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const editToken = url.searchParams.get('editToken');

    if (!userId || !editToken) {
      return NextResponse.json(
        { error: 'User ID and edit token are required' },
        { status: 400 }
      );
    }

    // Get the track and verify ownership and edit token
    const track = await prisma.track.findUnique({
      where: { id },
      include: { song: true },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Verify edit token
    if (track.song.editToken !== editToken) {
      return NextResponse.json(
        { error: 'Invalid edit token' },
        { status: 403 }
      );
    }

    // Verify track ownership
    if (track.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this track' },
        { status: 403 }
      );
    }

    // Extract the S3 key from the URL
    const s3Key = track.audioUrl.split('.com/')[1];

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: s3Key,
      })
    );

    // Delete from database
    await prisma.track.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { error: 'Failed to delete track' },
      { status: 500 }
    );
  }
}

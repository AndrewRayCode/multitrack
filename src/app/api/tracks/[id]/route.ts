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
  { params }: { params: { id: string } }
) {
  try {
    // Get the track to find its S3 key
    const track = await prisma.track.findUnique({
      where: { id: params.id },
      select: { audioUrl: true },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
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
      where: { id: params.id },
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

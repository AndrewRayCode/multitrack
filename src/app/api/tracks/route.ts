import { NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;
    const songId = formData.get('songId') as string;
    const userId = formData.get('userId') as string;

    if (!audio || !songId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the audio file is empty
    if (audio.size === 0) {
      return NextResponse.json(
        {
          error:
            'Audio file is empty. Please record some audio before uploading.',
        },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await audio.arrayBuffer());

    // Double-check buffer size
    if (buffer.length === 0) {
      return NextResponse.json(
        {
          error:
            'Audio buffer is empty. Please record some audio before uploading.',
        },
        { status: 400 }
      );
    }

    const key = `tracks/${uuidv4()}.webm`;

    console.log('making upload');
    // Upload to S3 using multipart upload
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: 'audio/webm',
      },
    });

    await upload.done();

    console.log('hi');

    // Create track in database
    const track = await prisma.track.create({
      data: {
        songId,
        userId,
        audioUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      },
    });

    console.log('done');
    return NextResponse.json(track);
  } catch (error) {
    console.error('Error handling track upload:', error);
    return NextResponse.json(
      { error: 'Error uploading track' },
      { status: 500 }
    );
  }
}

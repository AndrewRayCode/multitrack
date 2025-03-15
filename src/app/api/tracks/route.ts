import { NextResponse } from 'next/server'
import { S3 } from 'aws-sdk'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as Blob
    const songId = formData.get('songId') as string

    if (!audio || !songId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await audio.arrayBuffer())
    const key = `tracks/${uuidv4()}.wav`

    // Upload to S3
    await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: 'audio/wav',
      })
      .promise()

    // Create track in database
    const track = await prisma.track.create({
      data: {
        songId,
        audioUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      },
    })

    return NextResponse.json(track)
  } catch (error) {
    console.error('Error handling track upload:', error)
    return NextResponse.json(
      { error: 'Error uploading track' },
      { status: 500 }
    )
  }
} 
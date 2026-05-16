import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const brandKits = await prisma.brandKit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ brandKits });
  } catch (error) {
    console.error('Get brand kits error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand kits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, brandName, brandVoice, primaryColor, secondaryColor } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const brandKit = await prisma.brandKit.create({
      data: {
        userId: user.id,
        name,
        brandName,
        brandVoice,
        primaryColor,
        secondaryColor,
      },
    });

    return NextResponse.json(brandKit, { status: 201 });
  } catch (error) {
    console.error('Create brand kit error:', error);
    return NextResponse.json({ error: 'Failed to create brand kit' }, { status: 500 });
  }
}
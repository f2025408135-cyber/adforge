import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const original = await prisma.campaign.findUnique({ where: { id } });

    if (!original) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || original.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const duplicate = await prisma.campaign.create({
      data: {
        userId: user.id,
        productName: `${original.productName} (Copy)`,
        productDesc: original.productDesc,
        tone: original.tone,
        audience: original.audience,
        platforms: original.platforms,
        provider: original.provider,
        headline: original.headline,
        tagline: original.tagline,
        adCopy: original.adCopy,
        callToAction: original.callToAction,
        targetAudience: original.targetAudience,
        keyBenefits: original.keyBenefits,
        platformVersions: original.platformVersions,
        status: 'draft',
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error('Duplicate campaign error:', error);
    return NextResponse.json({ error: 'Failed to duplicate campaign' }, { status: 500 });
  }
}
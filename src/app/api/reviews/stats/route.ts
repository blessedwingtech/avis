import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SiteSource } from '@prisma/client';

// Helper pour gérer le CORS
function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS() {
  return setCorsHeaders(NextResponse.json({}, { status: 200 }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source');

  try {
    const where: any = {
      status: 'APPROVED',
      isPublic: true,
    };

    if (source && Object.keys(SiteSource).includes(source.toUpperCase())) {
      where.sourceSite = source.toUpperCase() as SiteSource;
    }

    const aggregations = await db.review.aggregate({
      where,
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const averageRating = aggregations._avg.rating ? Number(aggregations._avg.rating.toFixed(1)) : 0;
    const totalReviews = aggregations._count.id;

    return setCorsHeaders(
      NextResponse.json({
        averageRating,
        totalReviews,
      })
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return setCorsHeaders(NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 }));
  }
}

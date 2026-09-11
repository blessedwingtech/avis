import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SiteSource } from '@prisma/client';

// Helper pour gérer le CORS (pour autoriser les sous-domaines bittonik)
function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*'); // En prod, mettre: 'https://*.bittonik.com' ou gérer par middleware
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS() {
  return setCorsHeaders(NextResponse.json({}, { status: 200 }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      status: 'APPROVED',
      isPublic: true,
    };

    if (source && Object.keys(SiteSource).includes(source.toUpperCase())) {
      where.sourceSite = source.toUpperCase() as SiteSource;
    }

    const reviews = await db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        sourceSite: true,
        serviceRef: true,
        userName: true,
        avatarUrl: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    const total = await db.review.count({ where });

    return setCorsHeaders(
      NextResponse.json({
        reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    return setCorsHeaders(NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceSite, serviceRef, userName, userEmail, location, rating, comment, isPublic } = body;

    // Validation basique
    if (!sourceSite || !Object.keys(SiteSource).includes(sourceSite.toUpperCase())) {
      return setCorsHeaders(NextResponse.json({ error: 'Source invalide' }, { status: 400 }));
    }
    if (!rating || rating < 1 || rating > 5) {
      return setCorsHeaders(NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 }));
    }
    if (!comment || comment.trim().length < 5) {
      return setCorsHeaders(NextResponse.json({ error: 'Le commentaire est trop court' }, { status: 400 }));
    }

    // Filtre basique des mots (Exemple, on peut l'étendre avec la BD)
    const badWords = ['insulte', 'spam', 'viagra'];
    const commentLower = comment.toLowerCase();
    const containsBadWord = badWords.some((word) => commentLower.includes(word));

    if (containsBadWord) {
      return setCorsHeaders(NextResponse.json({ error: 'Votre commentaire contient un langage inapproprié.' }, { status: 400 }));
    }

    // Création de l'avis
    const newReview = await db.review.create({
      data: {
        sourceSite: sourceSite.toUpperCase() as SiteSource,
        serviceRef,
        userName: userName?.trim() || 'Utilisateur anonyme',
        userEmail,
        location: location?.trim() || null,
        rating: parseInt(rating),
        comment: comment.trim(),
        isPublic: isPublic !== undefined ? isPublic : true,
        status: 'APPROVED', // Par défaut approuvé après filtres
      },
    });

    return setCorsHeaders(NextResponse.json(newReview, { status: 201 }));
  } catch (error) {
    console.error('Erreur lors de la création de l\'avis:', error);
    return setCorsHeaders(NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 }));
  }
}

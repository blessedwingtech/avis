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
  const source = searchParams.get('source') || searchParams.get('sourceSite');
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
        location: true,
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

    // Normalisation intelligente et polymorphe (Tolérant à tous les formats : camelCase, snake_case, FR, EN)
    const rawSource = body.sourceSite || body.source_site || body.source || body.site || '';
    const sourceSite = typeof rawSource === 'string' ? rawSource.trim().toUpperCase() : '';

    const serviceRef = body.serviceRef || body.service_ref || body.product || body.item || null;
    const userId = body.userId || body.user_id || body.uid || body.id_user || null;
    const userName = body.userName || body.user_name || body.name || body.nom || body.nomComplet || body.nom_complet || body.fullName || body.full_name || body.username || 'Utilisateur anonyme';
    const userEmail = body.userEmail || body.user_email || body.email || body.mail || body.courriel || null;
    const avatarUrl = body.avatarUrl || body.avatar_url || body.avatar || body.photo || body.image || body.picture || body.profilePic || body.profile_picture || null;
    const location = body.location || body.ville || body.city || body.pays || body.country || null;

    const rawRating = body.rating ?? body.note ?? body.stars ?? body.etoiles;
    const rating = typeof rawRating === 'string' ? parseInt(rawRating, 10) : Number(rawRating);

    const rawComment = body.comment || body.message || body.avis || body.text || body.content || '';
    const comment = typeof rawComment === 'string' ? rawComment.trim() : '';

    const isPublic = body.isPublic !== undefined 
      ? Boolean(body.isPublic) 
      : (body.is_public !== undefined ? Boolean(body.is_public) : true);

    // Validation basique
    if (!sourceSite || !Object.keys(SiteSource).includes(sourceSite)) {
      return setCorsHeaders(NextResponse.json({ error: 'Source invalide (doit être BITTONIK, PRESSTONIK, MEMOTONIK, SHOPTONIK ou BWT)' }, { status: 400 }));
    }
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return setCorsHeaders(NextResponse.json({ error: 'La note doit être un nombre entre 1 et 5' }, { status: 400 }));
    }
    if (!comment || comment.length < 5) {
      return setCorsHeaders(NextResponse.json({ error: 'Le commentaire doit faire au moins 5 caractères' }, { status: 400 }));
    }

    // Filtre basique des mots abusifs
    const badWords = ['insulte', 'spam', 'viagra'];
    const commentLower = comment.toLowerCase();
    const containsBadWord = badWords.some((word) => commentLower.includes(word));

    if (containsBadWord) {
      return setCorsHeaders(NextResponse.json({ error: 'Votre commentaire contient un langage inapproprié.' }, { status: 400 }));
    }

    // Création de l'avis avec les colonnes PostgreSQL standardisées
    const newReview = await db.review.create({
      data: {
        sourceSite: sourceSite as SiteSource,
        serviceRef,
        userId: userId ? String(userId) : null,
        userName: typeof userName === 'string' ? userName.trim() : 'Utilisateur anonyme',
        userEmail: userEmail ? String(userEmail).trim() : null,
        avatarUrl: avatarUrl ? String(avatarUrl).trim() : null,
        location: location ? String(location).trim() : null,
        rating,
        comment,
        isPublic,
        status: 'APPROVED', // Par défaut approuvé après filtres
      },
    });

    return setCorsHeaders(NextResponse.json(newReview, { status: 201 }));
  } catch (error) {
    console.error('Erreur lors de la création de l\'avis:', error);
    return setCorsHeaders(NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 }));
  }
}

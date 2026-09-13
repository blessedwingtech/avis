'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Star, 
  MessageSquare, 
  User, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Mail,
  Image as ImageIcon, 
  Globe, 
  Newspaper, 
  ShoppingBag, 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Check, 
  ArrowRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

// Structure de session utilisateur (SSO & Cross-Site)
interface UserSession {
  userId?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  sourceSite?: string;
}

interface RecentReview {
  id: string;
  userName: string | null;
  location: string | null;
  rating: number;
  comment: string;
  sourceSite: string;
  avatarUrl?: string | null;
  createdAt: string;
}

const RATING_SENTIMENTS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Décevant', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  2: { label: 'Passable', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  3: { label: 'Bien', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  4: { label: 'Très satisfait', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  5: { label: 'Exceptionnel ! 🌟', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
};

function ReviewForm() {
  const searchParams = useSearchParams();
  const initialSource = searchParams.get('source');
  const returnUrl = searchParams.get('return_url');
  const serviceRef = searchParams.get('serviceRef') || searchParams.get('service_ref') || searchParams.get('product');

  // Extraction intelligente des informations utilisateur envoyées par le site satellite (SSO / Redirection)
  const paramName = searchParams.get('user_name') || searchParams.get('name') || searchParams.get('username') || searchParams.get('full_name');
  const paramEmail = searchParams.get('user_email') || searchParams.get('email');
  const paramAvatar = searchParams.get('user_avatar') || searchParams.get('avatar') || searchParams.get('avatar_url') || searchParams.get('photo');
  const paramUserId = searchParams.get('user_id') || searchParams.get('userId') || searchParams.get('id');
  const paramLocation = searchParams.get('location') || searchParams.get('city');

  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sourceSite, setSourceSite] = useState<string>(initialSource || 'BITTONIK');
  const [isPublic, setIsPublic] = useState(true);
  const [name, setName] = useState(paramName || '');
  const [email, setEmail] = useState(paramEmail || '');
  const [location, setLocation] = useState(paramLocation || '');
  
  // État de session
  const [session, setSession] = useState<UserSession | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<any>(null);
  const [error, setError] = useState('');
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [allReviews, setAllReviews] = useState<RecentReview[]>([]);
  const [loadingAllReviews, setLoadingAllReviews] = useState(false);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

  // Filtres de l'explorateur d'avis
  const [listFilterSite, setListFilterSite] = useState<string>('ALL');
  const [listFilterRating, setListFilterRating] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialisation de la session (si transmis par URL, SSO BitTonik ou cookie)
  useEffect(() => {
    if (paramName || paramEmail || paramUserId) {
      const userSess: UserSession = {
        userId: paramUserId || undefined,
        name: paramName || 'Utilisateur',
        email: paramEmail || '',
        avatarUrl: paramAvatar || undefined,
        sourceSite: initialSource || undefined,
      };
      setSession(userSess);
      if (paramName) setName(paramName);
      if (paramEmail) setEmail(paramEmail);
      if (paramLocation) setLocation(paramLocation);
    }
  }, [paramName, paramEmail, paramAvatar, paramUserId, paramLocation, initialSource]);

  // Récupérer les stats globales
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/reviews/stats');
        if (res.ok) {
          const data = await res.json();
          setStats({
            averageRating: data.averageRating || 0,
            totalReviews: data.totalReviews || 0,
          });
        }
      } catch (e) {
        // Silencieux
      }
    };
    fetchStats();
  }, []);

  // Récupérer les avis récents pour le social proof
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch(`/api/reviews?limit=3&source=${sourceSite}`);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && data.reviews.length > 0) {
            setRecentReviews(data.reviews);
          }
        }
      } catch (e) {
        // Silencieux
      }
    };
    fetchRecent();
  }, [sourceSite]);

  // Récupérer la liste complète des avis quand on bascule sur l'onglet 'list'
  useEffect(() => {
    if (activeTab === 'list') {
      const fetchAll = async () => {
        setLoadingAllReviews(true);
        try {
          const url = listFilterSite === 'ALL'
            ? '/api/reviews?limit=50'
            : `/api/reviews?limit=50&source=${listFilterSite}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setAllReviews(data.reviews || []);
          }
        } catch (e) {
          // Silencieux
        } finally {
          setLoadingAllReviews(false);
        }
      };
      fetchAll();
    }
  }, [activeTab, listFilterSite]);

  const sites = [
    { 
      id: 'BITTONIK', 
      name: 'BitTonik',
      subtitle: 'Réseau & Communauté', 
      text: "le réseau BitTonik",
      headerTitle: "Avis BitTonik",
      headerDesc: "Votre voix compte. Aidez notre écosystème à grandir en partageant votre expérience sur le réseau.",
      icon: Globe,
      color: 'from-emerald-500 to-teal-700'
    },
    { 
      id: 'PRESSTONIK', 
      name: 'PressTonik',
      subtitle: 'Média & Actualités', 
      text: "le média PressTonik",
      headerTitle: "Avis PressTonik",
      headerDesc: "Qu'avez-vous pensé de nos articles et analyses ? Partagez vos impressions sur notre média.",
      icon: Newspaper,
      color: 'from-blue-600 to-indigo-700'
    },
    { 
      id: 'MEMOTONIK', 
      name: 'MemoTonik',
      subtitle: 'Galerie & Souvenirs', 
      text: "la galerie MemoTonik",
      headerTitle: "Avis MemoTonik",
      headerDesc: "Votre avis sur la galerie MemoTonik nous aide à toujours mieux préserver et valoriser vos souvenirs.",
      icon: ImageIcon,
      color: 'from-amber-500 to-orange-600'
    },
    { 
      id: 'SHOPTONIK', 
      name: 'ShopTonik',
      subtitle: 'Marketplace & Shopping', 
      text: "le marketplace ShopTonik",
      headerTitle: "Avis ShopTonik",
      headerDesc: "Partagez votre expérience d'achat et aidez notre communauté de vendeurs et acheteurs.",
      icon: ShoppingBag,
      color: 'from-purple-600 to-pink-600'
    },
    { 
      id: 'BWT', 
      name: 'BWT',
      subtitle: 'Formations & Services Tech', 
      text: "les services et formations BWT",
      headerTitle: "Avis Blessed Wing Tech",
      headerDesc: "Comment avez-vous trouvé nos formations et solutions d'ingénierie tech ? Dites-nous tout.",
      icon: GraduationCap,
      color: 'from-[#006039] to-emerald-800'
    },
  ];

  const currentSite = useMemo(() => {
    return sites.find(s => s.id === sourceSite) || sites[0];
  }, [sourceSite]);

  const activeRating = hoveredRating || rating;
  const sentiment = activeRating > 0 ? RATING_SENTIMENTS[activeRating] : null;

  const filteredReviews = useMemo(() => {
    return allReviews.filter((rev) => {
      const matchesRating = listFilterRating === 'ALL' || rev.rating === listFilterRating;
      const matchesQuery = searchQuery.trim() === '' || 
        rev.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rev.userName && rev.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rev.location && rev.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesRating && matchesQuery;
    });
  }, [allReviews, listFilterRating, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Veuillez sélectionner une note en cliquant sur les étoiles.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }
    if (comment.trim().length < 5) {
      setError('Votre commentaire doit faire au moins 5 caractères.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      sourceSite,
      serviceRef: serviceRef || null,
      userId: session?.userId || null,
      userName: name.trim() || session?.name || 'Utilisateur anonyme',
      userEmail: email.trim() || session?.email || null,
      avatarUrl: session?.avatarUrl || null,
      location: location.trim() || null,
      rating,
      comment: comment.trim(),
      isPublic,
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur (${res.status}: ${res.statusText || 'Vérifiez la connexion'})`);
      }

      setSubmittedReview(data || payload);
      setSuccess(true);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const displayAvatar = submittedReview?.avatarUrl || session?.avatarUrl;
    const displayName = submittedReview?.userName || name || session?.name || 'Utilisateur';

    return (
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 sm:p-12 text-center transition-all animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#006039]/10 rounded-full blur-3xl opacity-60 pointer-events-none" />
        
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl border border-emerald-200/60 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-[#006039]" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 text-emerald-800 text-xs font-bold rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Avis Certifié & Publié
        </span>

        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
          Merci {session ? session.name : ''} pour votre retour !
        </h2>
        <p className="text-slate-600 max-w-md mx-auto text-base leading-relaxed mb-8">
          Votre témoignage sur <strong className="text-slate-800">{currentSite.name}</strong> a bien été enregistré. Il est désormais synchronisé sur l'ensemble du réseau BitTonik.
        </p>

        {/* Aperçu de la carte d'avis publiée */}
        {submittedReview && (
          <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200/80 rounded-xl p-6 text-left mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="w-11 h-11 rounded-full border border-slate-300 object-cover shadow-sm" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#006039] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">{displayName}</h4>
                    {session && (
                      <span className="text-[10px] bg-emerald-100 text-[#006039] px-1.5 py-0.2 rounded font-semibold">Vérifié</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {location && <><MapPin className="w-3 h-3" /> {location} •</>} {currentSite.name}
                  </p>
                </div>
              </div>
              <div className="flex text-[#f39c12]">
                {[...Array(submittedReview.rating || rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-slate-700 text-sm italic line-clamp-3">
              "{submittedReview.comment || comment}"
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('list')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 px-6 rounded-xl transition-all"
          >
            <Star className="w-4 h-4 fill-[#f39c12] text-[#f39c12]" /> Consulter tous les avis
          </button>

          {returnUrl ? (
            <a
              href={returnUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#006039] hover:bg-[#004d2d] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-[#006039]/20 transition-all hover:translate-y-[-1px]"
            >
              Retourner sur {currentSite.name} <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <button
              onClick={() => {
                setSuccess(false);
                setRating(0);
                setComment('');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#006039] hover:bg-[#004d2d] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-[#006039]/20 transition-all hover:translate-y-[-1px]"
            >
              Déposer un autre avis <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation Onglets (Déposer un avis vs Explorer les avis) */}
      <div className="flex items-center justify-center mb-10">
        <div className="bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200 flex gap-2 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'form'
                ? 'bg-white text-[#006039] shadow-md shadow-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#006039]" />
            Déposer un avis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'list'
                ? 'bg-white text-[#006039] shadow-md shadow-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4 fill-[#f39c12] text-[#f39c12]" />
            Consulter les avis {stats.totalReviews > 0 && `(${stats.totalReviews})`}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        /* VUE: LISTE & EXPLORATEUR DES AVIS */
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header de la liste */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[#006039] text-xs font-bold tracking-wide uppercase mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#e67e22]" />
              Transparence & Retours d'Expérience
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Avis & Témoignages de la Communauté
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Retrouvez l'ensemble des évaluations certifiées sur les services de l'écosystème BitTonik.
            </p>

            {/* Score global */}
            {stats.totalReviews > 0 && (
              <div className="mt-6 inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex text-[#f39c12]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${s <= Math.round(stats.averageRating) ? 'fill-current' : 'fill-transparent stroke-slate-300'}`}
                    />
                  ))}
                </div>
                <span className="font-black text-slate-900 text-base">{stats.averageRating.toFixed(1)} / 5</span>
                <span className="text-xs text-slate-400 font-medium">({stats.totalReviews} avis vérifiés)</span>
              </div>
            )}
          </div>

          {/* Barre de Recherche & Filtres */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Recherche textuelle */}
              <div className="relative w-full md:w-80">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher mot-clé, auteur..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
                />
              </div>

              {/* Filtre par étoiles */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setListFilterRating('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    listFilterRating === 'ALL'
                      ? 'bg-[#006039] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Toutes notes
                </button>
                {[5, 4, 3, 2, 1].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setListFilterRating(r)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      listFilterRating === r
                        ? 'bg-[#006039] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{r}</span>
                    <Star className="w-3 h-3 fill-[#f39c12] text-[#f39c12]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre par Plateforme */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase mr-1">Plateforme :</span>
              <button
                type="button"
                onClick={() => setListFilterSite('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  listFilterSite === 'ALL'
                    ? 'bg-emerald-100 text-[#006039] font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tout le réseau
              </button>
              {sites.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setListFilterSite(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    listFilterSite === s.id
                      ? 'bg-emerald-100 text-[#006039] font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grille des Avis */}
          {loadingAllReviews ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#006039]" />
              <p className="text-sm font-semibold text-slate-400">Chargement des témoignages...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-slate-800">Aucun avis trouvé</h4>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                Aucun avis ne correspond à vos filtres actuels.
              </p>
              <button
                type="button"
                onClick={() => {
                  setListFilterSite('ALL');
                  setListFilterRating('ALL');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-[#006039] hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header de la carte */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {rev.avatarUrl ? (
                          <img
                            src={rev.avatarUrl}
                            alt={rev.userName || ''}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#006039] to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                            {(rev.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{rev.userName || 'Utilisateur anonyme'}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">
                              {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                            {rev.location && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                • <MapPin className="w-3 h-3 text-slate-400" /> {rev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Étoiles */}
                      <div className="flex text-[#f39c12]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* Contenu */}
                    <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* Badge de provenance */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                      Service : <span className="text-[#006039]">{rev.sourceSite}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Avis Certifié
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bouton pour revenir au formulaire */}
          <div className="pt-8 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className="inline-flex items-center gap-2 bg-[#006039] hover:bg-[#004d2d] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-[#006039]/20 transition-all hover:translate-y-[-1px]"
            >
              <MessageSquare className="w-4 h-4" /> Déposer mon propre avis
            </button>
          </div>
        </div>
      ) : (
        /* VUE: FORMULAIRE DE DÉPÔT D'AVIS */
        <>
          {/* En-tête Dynamique avec badge et typographie SaaS */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[#006039] text-xs font-bold tracking-wide uppercase mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#e67e22]" />
              Écosystème BitTonik • Avis Certifiés
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3 flex-wrap">
              <span>{currentSite.headerTitle.split(' ')[0]}</span>
              <span className="bg-gradient-to-r from-[#006039] to-emerald-600 bg-clip-text text-transparent">
                {currentSite.headerTitle.substring(currentSite.headerTitle.indexOf(' ') + 1)}
              </span>
            </h1>

            <p className="mt-4 text-slate-600 text-base sm:text-lg font-normal max-w-xl mx-auto leading-relaxed">
              {currentSite.headerDesc}
            </p>
          </div>

          {/* Formulaire Principal avec Card Glassmorphism */}
          <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-10 transition-all">
            
            {error && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 font-medium rounded-xl flex items-center gap-3 animate-in fade-in">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{error}</span>
              </div>
            )}

            {/* ÉTAPE 1: SÉLECTEUR DE PLATEFORME VISUEL */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[#e67e22] text-xs font-black uppercase tracking-wider block">Étape 01</span>
                  <h3 className="text-slate-900 font-bold text-lg">Choisissez la plateforme évaluée</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">5 services disponibles</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {sites.map((site) => {
                  const Icon = site.icon;
                  const isSelected = sourceSite === site.id;
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => setSourceSite(site.id)}
                      className={`relative p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 group ${
                        isSelected
                          ? 'border-[#006039] bg-emerald-50/50 ring-2 ring-[#006039]/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#006039] text-white rounded-full flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${
                        isSelected ? 'bg-[#006039] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 text-xs sm:text-sm tracking-tight">{site.name}</span>
                        <span className="text-[11px] text-slate-500 block line-clamp-1">{site.subtitle.split(' ')[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ÉTAPE 2: ÉVALUATION & COMMENTAIRE */}
            <div className="mb-10">
              <div className="mb-4 pb-3 border-b border-slate-100">
                <span className="text-[#e67e22] text-xs font-black uppercase tracking-wider block">Étape 02</span>
                <h3 className="text-slate-900 font-bold text-lg">Votre Note & Expérience</h3>
              </div>
              
              <div className="space-y-6">
                {/* Étoiles & Sentiments */}
                <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-bold text-slate-800">
                      Note Globale <span className="text-rose-500">*</span>
                    </label>
                    {sentiment ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-all ${sentiment.bg} ${sentiment.color}`}>
                        {sentiment.label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Cliquez pour noter</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 focus:outline-none transition-all duration-150 transform hover:scale-125 active:scale-95"
                        aria-label={`Noter ${star} sur 5`}
                      >
                        <Star
                          className={`w-9 h-9 sm:w-11 sm:h-11 transition-all duration-200 ${
                            activeRating >= star
                          ? 'fill-[#f39c12] text-[#f39c12] drop-shadow-[0_2px_8px_rgba(243,156,18,0.35)]'
                          : 'fill-transparent stroke-[1.5px] text-slate-300 hover:text-slate-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commentaire Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-800">
                      Détaillez votre expérience avec {currentSite.text} <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-xs ${comment.length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {comment.length} / 1000
                    </span>
                  </div>
                  <textarea
                    value={comment}
                    maxLength={1000}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Qu'avez-vous particulièrement apprécié ? La réactivité, l'ergonomie, la qualité du service ? Dites-nous tout..."
                    className="w-full h-32 bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition resize-y placeholder:text-slate-400 text-sm leading-relaxed"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ÉTAPE 3: INFORMATIONS DE L'AUTEUR / SSO */}
            <div className="mb-10">
              <div className="mb-4 pb-3 border-b border-slate-100">
                <span className="text-[#e67e22] text-xs font-black uppercase tracking-wider block">Étape 03</span>
                <h3 className="text-slate-900 font-bold text-lg">Informations Auteur</h3>
              </div>

              {session ? (
                /* Carte de Session Connectée SSO / Provenance Satellite */
                <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 shadow-sm">
                  <div className="relative">
                    {session.avatarUrl ? (
                      <img src={session.avatarUrl} alt={session.name} className="w-14 h-14 rounded-full border-2 border-emerald-400 object-cover shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#006039] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px]">
                      ✓
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-900 text-base">{session.name}</p>
                      <span className="px-2 py-0.5 bg-emerald-200/80 text-[#006039] text-[11px] font-bold rounded-full">
                        Compte Vérifié
                      </span>
                    </div>
                    {session.email && <p className="text-xs text-slate-600 font-medium">{session.email}</p>}
                    <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                      <span>Connecté via {currentSite.name}</span>
                    </p>
                  </div>

                  <div className="sm:ml-auto w-full sm:w-auto">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ville / Pays (Optionnel)"
                        className="w-full sm:w-44 bg-white border border-emerald-300 text-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulaire Manuel si Non Connecté */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Nom ou Pseudonyme <span className="text-slate-400 font-normal normal-case">(Optionnel)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Jean-Marc Dupont"
                          className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Adresse email <span className="text-emerald-700 font-normal normal-case">(100% Confidentiel)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nom@exemple.com"
                          className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Ville / Pays <span className="text-slate-400 font-normal normal-case">(Optionnel)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ex: Port-au-Prince, Haïti"
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CONSENTEMENT & BOUTON PRINCIPAL */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-start gap-3 mb-8">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-[#006039] bg-white border-slate-300 rounded focus:ring-[#006039] cursor-pointer"
                  />
                </div>
                <label htmlFor="isPublic" className="text-xs sm:text-sm text-slate-600 cursor-pointer select-none leading-normal">
                  J'atteste de la sincérité de mon témoignage et j'autorise BitTonik à l'afficher publiquement sur ses plateformes.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#006039] hover:bg-[#004d2d] disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-[#006039]/25 hover:shadow-xl hover:shadow-[#006039]/30 transition-all duration-200 flex justify-center items-center gap-2 text-base ml-auto hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...
                  </>
                ) : (
                  <>
                    Publier mon avis certifié <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 3 PILIERS DE CONFIANCE (TRUST BADGES) */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl p-5 text-center shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Confidentialité Totale</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Votre email reste 100% privé et ne sera jamais divulgué.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl p-5 text-center shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center mx-auto mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Synchronisation Réseau</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Votre avis est instantanément diffusé sur la plateforme ciblée.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl p-5 text-center shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#006039] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Avis 100% Certifiés</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Protection anti-spam et authenticité des avis garanties.</p>
            </div>
          </div>

          {/* DERNIERS AVIS DE LA COMMUNAUTÉ (SOCIAL PROOF PREVIEW) */}
          {recentReviews.length > 0 && (
            <div className="mt-14 pt-10 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Derniers avis certifiés sur {currentSite.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Rejoignez les utilisateurs qui partagent leur expérience</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs font-bold text-[#006039] hover:text-[#004d2d] flex items-center gap-1 hover:underline"
                >
                  Voir tous les avis ({stats.totalReviews || recentReviews.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentReviews.map((rev) => (
                  <div key={rev.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex text-[#f39c12]">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs italic line-clamp-3 mb-3">
                        "{rev.comment}"
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                      {rev.avatarUrl ? (
                        <img src={rev.avatarUrl} alt={rev.userName || ''} className="w-5 h-5 rounded-full object-cover border border-slate-300" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {(rev.userName || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{rev.userName || 'Utilisateur anonyme'}</span>
                      {rev.location && <span className="text-slate-400 text-[10px]">({rev.location})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative overflow-x-hidden">
      {/* Background Grid Pattern & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-96 bg-gradient-to-b from-[#006039]/10 via-[#006039]/3 to-transparent blur-3xl pointer-events-none" />

      {/* TOP NAVIGATION BAR (GLASSMORPHISM) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo avec Étoile Dorée */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#006039] to-emerald-600 flex items-center justify-center shadow-md shadow-[#006039]/20 text-[#f39c12]">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Avis<span className="text-[#006039]">Hub</span>
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                BitTonik
              </span>
            </div>
          </div>

          {/* Badge statut vérifié */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[#006039] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Plateforme Officielle</span> Certifiée
            </span>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#006039]" />
            <p className="text-sm font-semibold text-slate-500">Chargement de la plateforme d'avis...</p>
          </div>
        }>
          <ReviewForm />
        </Suspense>

        {/* FOOTER */}
        <footer className="mt-16 pt-8 border-t border-slate-200/80 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-600">
            &copy; {new Date().getFullYear()} Blessed Wing Tech & BitTonik Network. Tous droits réservés.
          </p>
          <p className="text-[11px] text-slate-400">
            Plateforme centralisée de recueil d'avis certifiés pour l'ensemble des services de l'écosystème.
          </p>
        </footer>
      </main>
    </div>
  );
}

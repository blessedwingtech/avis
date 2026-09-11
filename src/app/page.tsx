'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, MessageSquare, User, Loader2, CheckCircle2, MapPin, Image as ImageIcon } from 'lucide-react';

// Simulation de session (SSO) pour le frontend
interface UserSession {
  name: string;
  email: string;
  avatarUrl?: string;
}

function ReviewForm() {
  const searchParams = useSearchParams();
  const initialSource = searchParams.get('source');
  const returnUrl = searchParams.get('return_url');

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sourceSite, setSourceSite] = useState<string>(initialSource || 'BITTONIK');
  const [isPublic, setIsPublic] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  
  // État de session
  const [session, setSession] = useState<UserSession | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Simuler la récupération de la session Bittonik partagée
  useEffect(() => {
    const checkSession = async () => {
      const mockSession = null; 
      if (mockSession) {
        setSession(mockSession);
        setName(mockSession.name);
        setEmail(mockSession.email);
      }
    };
    checkSession();
  }, []);

  const sites = [
    { 
      id: 'BITTONIK', 
      label: 'Réseau BitTonik (Communauté)', 
      text: "le réseau BitTonik",
      headerTitle: "Avis BitTonik",
      headerDesc: "Votre voix compte. Aidez notre communauté à grandir en partageant votre expérience globale sur le réseau."
    },
    { 
      id: 'PRESSTONIK', 
      label: 'PressTonik (Média)', 
      text: "le média PressTonik",
      headerTitle: "Avis PressTonik",
      headerDesc: "Qu'avez-vous pensé de vos lectures ? Partagez vos impressions sur notre plateforme d'actualités."
    },
    { 
      id: 'MEMOTONIK', 
      label: 'MemoTonik (Galerie)', 
      text: "la galerie MemoTonik",
      headerTitle: "Avis MemoTonik",
      headerDesc: "Votre avis sur la galerie MemoTonik nous aide à toujours mieux sécuriser vos précieux souvenirs."
    },
    { 
      id: 'SHOPTONIK', 
      label: 'ShopTonik (Boutique)', 
      text: "le marketplace ShopTonik",
      headerTitle: "Avis ShopTonik",
      headerDesc: "Partagez votre expérience d'achat et aidez-nous à perfectionner le marketplace ShopTonik."
    },
    { 
      id: 'BWT', 
      label: 'BWT (Formations / Services)', 
      text: "les services et formations BWT",
      headerTitle: "Avis Blessed Wing Tech",
      headerDesc: "Comment avez-vous trouvé notre séance de formations ou nos services tech ? Dites-nous tout."
    },
  ];

  const currentSite = useMemo(() => {
    return sites.find(s => s.id === sourceSite) || sites[0];
  }, [sourceSite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Veuillez sélectionner une note (étoiles).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (comment.trim().length < 5) {
      setError('Votre commentaire doit faire au moins 5 caractères.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSite,
          rating,
          comment,
          isPublic,
          userName: name,
          userEmail: email,
          location,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data?.error || `Erreur du serveur (${res.status}: ${res.statusText || 'Vérifiez la connexion'})`);
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6 py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
        <CheckCircle2 className="w-20 h-20 text-[#006039] mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Votre avis a été publié avec succès !</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Toute la communauté BitTonik vous remercie pour votre contribution. Votre voix nous aide à nous améliorer continuellement.
        </p>
        {returnUrl && (
          <a
            href={returnUrl}
            className="inline-block mt-6 bg-[#006039] hover:bg-[#004d2d] text-white font-semibold py-3 px-8 rounded-md transition-colors"
          >
            Retourner au site d'origine
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      {/* En-tête Dynamique basé sur la sélection */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <MessageSquare className="w-8 h-8 text-[#006039]" />
          {currentSite.headerTitle.split(' ')[0]} <span className="text-[#006039]">{currentSite.headerTitle.substring(currentSite.headerTitle.indexOf(' ') + 1)}</span>
        </h1>
        <p className="mt-3 text-slate-600 text-lg font-medium max-w-xl mx-auto">
          {currentSite.headerDesc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10">
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded-r-md">
            {error}
          </div>
        )}

        {/* SECTION 1: LE SERVICE */}
        <div className="mb-10">
          <h3 className="text-[#006039] font-bold text-xl mb-6 pb-2 border-b border-slate-100">
            <span className="text-[#e67e22] text-sm font-bold uppercase tracking-wider block mb-1">Étape 01</span>
            Le Service Évalué
          </h3>
          
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800">
              Sur quelle plateforme souhaitez-vous donner un avis ? <span className="text-red-500">*</span>
            </label>
            <select
              value={sourceSite}
              onChange={(e) => setSourceSite(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-700 rounded-md px-4 py-3 focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition cursor-pointer"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION 2: L'AVIS */}
        <div className="mb-10">
          <h3 className="text-[#006039] font-bold text-xl mb-6 pb-2 border-b border-slate-100">
            <span className="text-[#e67e22] text-sm font-bold uppercase tracking-wider block mb-1">Étape 02</span>
            Votre Évaluation
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800">
                Note globale <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-105"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors duration-200 ${
                        (hoveredRating || rating) >= star
                          ? 'fill-[#f39c12] text-[#f39c12]'
                          : 'fill-transparent stroke-[1.5px] text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating === 0 && <p className="text-xs text-slate-500 mt-1">Cliquez sur une étoile pour attribuer une note.</p>}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800">
                Partagez les détails de votre expérience avec {currentSite.text} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Qu'avez-vous particulièrement apprécié ? Que pourrions-nous améliorer ?"
                className="w-full h-32 bg-white border border-slate-300 text-slate-800 rounded-md px-4 py-3 focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition resize-y placeholder:text-slate-400"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: INFORMATIONS PERSONNELLES */}
        <div className="mb-10">
          <h3 className="text-[#006039] font-bold text-xl mb-6 pb-2 border-b border-slate-100">
            <span className="text-[#e67e22] text-sm font-bold uppercase tracking-wider block mb-1">Étape 03</span>
            Informations Personnelles
          </h3>

          {session ? (
            // Affichage si l'utilisateur est connecté via SSO
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-4 mb-6">
              {session.avatarUrl ? (
                <img src={session.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-300 object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#006039]/10 text-[#006039] flex items-center justify-center font-bold text-lg">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-800">{session.name}</p>
                <p className="text-sm text-slate-500">{session.email}</p>
              </div>
              <div className="ml-auto">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Connecté</span>
              </div>
            </div>
          ) : (
            // Formulaire manuel si non connecté
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Nom complet <span className="text-slate-400 font-normal text-xs">(Optionnel)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Louis Bentzky"
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Adresse email <span className="text-slate-400 font-normal text-xs">(Privé)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              Lieu / Géolocalisation <span className="text-slate-400 font-normal text-xs">(Optionnel)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Port-au-Prince, Haïti"
                className="w-full bg-white border border-slate-300 text-slate-800 rounded-md pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-[#006039]/20 focus:border-[#006039] outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* CONSENTEMENT & SOUMISSION */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-start gap-3 mb-8">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-[#006039] bg-white border-slate-300 rounded focus:ring-[#006039] cursor-pointer"
              />
            </div>
            <label htmlFor="isPublic" className="text-sm text-slate-600 cursor-pointer select-none">
              J'autorise BitTonik à afficher mon avis publiquement sur ses plateformes.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-[#006039] hover:bg-[#004d2d] disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-md transition-colors flex justify-center items-center gap-2 text-base ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Traitement...
              </>
            ) : (
              'Soumettre mon avis'
            )}
          </button>
        </div>
      </form>
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Le Header Dynamique et le Formulaire Principal sont gérés dans ReviewForm */}
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#006039]" /></div>}>
          <ReviewForm />
        </Suspense>
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm font-semibold text-slate-400">
          &copy; {new Date().getFullYear()} Blessed Wing Tech.
        </div>
      </div>
    </main>
  );
}

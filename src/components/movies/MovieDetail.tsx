/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Star,
  Clock,
  Calendar,
  Check,
  Globe,
  Play,
  Plus,
  User,
  MessageSquare,
  Heart,
} from "lucide-react";
import { Movie, Cast } from "@/src/types";
import { TMDB_CONFIG } from "@/src/constants";
import { formatCurrency, formatDate, cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import MovieCard from "./MovieCard";
import VideoModal from "../layout/VideoModal";
import PersonModal from "./PersonModal";
import CastOverlay from "./CastOverlay";
import { useTheme } from "@/src/lib/ThemeContext";

interface MovieVideo {
  key: string;
  site: string;
  type: string;
}

export default function MovieDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get("type") || "movie";
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [isCastOverlayOpen, setIsCastOverlayOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const watchlist = JSON.parse(
        localStorage.getItem("adnflix_watchlist") || "[]",
      );
      const favorites = JSON.parse(
        localStorage.getItem("adnflix_favorites") || "[]",
      );
      const movieId = movie?.id || parseInt(id || "0");
      setIsInWatchlist(watchlist.some((m: any) => m.id === movieId));
      setIsInFavorites(favorites.some((m: any) => m.id === movieId));
    };

    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener("adnflix_sync", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("adnflix_sync", syncState);
    };
  }, [id, movie?.id]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [movieData, castData, similarData] = await Promise.all([
          fetch(`/api/movies/${mediaType}/${id}`).then((r) => r.json()),
          fetch(`/api/movies/${mediaType}/${id}/credits`).then((r) => r.json()),
          fetch(`/api/movies/${mediaType}/${id}/recommendations`).then((r) =>
            r.json(),
          ),
        ]);
        setMovie(movieData);
        setCast(castData.cast || []);
        // Prioritize recommendations, fallback to similar if empty
        setSimilar(
          similarData.results?.length > 0
            ? similarData.results.slice(0, 6)
            : [],
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, mediaType]);

  // Track History
  useEffect(() => {
    if (movie) {
      const history = JSON.parse(
        localStorage.getItem("adnflix_history") || "[]",
      );
      // Remove if already exists to move it to the top (most recent)
      const filteredHistory = history.filter(
        (item: any) => item.id !== movie.id,
      );
      const newHistory = [
        {
          ...movie,
          media_type: mediaType,
          watchedAt: new Date().toISOString(),
        },
        ...filteredHistory,
      ].slice(0, 50);
      localStorage.setItem("adnflix_history", JSON.stringify(newHistory));
      window.dispatchEvent(new Event("adnflix_sync"));
    }
  }, [movie, mediaType]);

  const handleAddReview = () => {
    if (!movie) return;
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = () => {
    if (!movie || !reviewText.trim()) return;

    const reviews = JSON.parse(localStorage.getItem("adnflix_reviews") || "[]");
    const newReview = {
      id: movie.id,
      title,
      poster_path: movie.poster_path,
      review: reviewText.trim(),
      rating: reviewRating,
      date: new Date().toISOString(),
      media_type: mediaType,
    };

    localStorage.setItem(
      "adnflix_reviews",
      JSON.stringify([newReview, ...reviews]),
    );

    setIsReviewModalOpen(false);
    setReviewText("");
    setReviewRating(5);

    window.dispatchEvent(new Event("adnflix_sync"));
    window.dispatchEvent(
      new CustomEvent("adnflix_toast", {
        detail: { message: "Review added!" },
      }),
    );
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewText("");
    setReviewRating(5);
  };

  const handleWatchTrailer = async () => {
    if (!movie) return;
    try {
      const res = await fetch(`/api/movies/${mediaType}/${movie.id}/videos`);
      const data = await res.json();
      const trailer = data.results?.find(
        (v: MovieVideo) => v.type === "Trailer" && v.site === "YouTube",
      );
      if (trailer) {
        setTrailerKey(trailer.key);
      } else {
        window.dispatchEvent(
          new CustomEvent("adnflix_toast", {
            detail: { message: "Trailer not available for this title" },
          }),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWatchlist = () => {
    if (!movie) return;
    const watchlist = JSON.parse(
      localStorage.getItem("adnflix_watchlist") || "[]",
    );
    const exists = watchlist.some((m: any) => m.id === movie.id);
    const newWatchlist = exists
      ? watchlist.filter((m: any) => m.id !== movie.id)
      : [...watchlist, movie];
    localStorage.setItem("adnflix_watchlist", JSON.stringify(newWatchlist));
    window.dispatchEvent(new Event("adnflix_sync"));
    window.dispatchEvent(
      new CustomEvent("adnflix_toast", {
        detail: {
          message: exists ? "Removed from Watchlist" : "Added to Watchlist",
          movieTitle: title,
        },
      }),
    );
  };

  const toggleFavorites = () => {
    if (!movie) return;
    const favorites = JSON.parse(
      localStorage.getItem("adnflix_favorites") || "[]",
    );
    const exists = favorites.some((m: any) => m.id === movie.id);
    const newFavorites = exists
      ? favorites.filter((m: any) => m.id !== movie.id)
      : [...favorites, movie];
    localStorage.setItem("adnflix_favorites", JSON.stringify(newFavorites));
    window.dispatchEvent(new Event("adnflix_sync"));
    window.dispatchEvent(
      new CustomEvent("adnflix_toast", {
        detail: {
          message: exists ? "Removed from Favorites" : "Added to Favorites",
          movieTitle: title,
        },
      }),
    );
  };

  const handlePersonClick = (personId: number) => {
    setSelectedPersonId(personId);
  };

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg-main pt-20">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );

  if (!movie)
    return (
      <div className="pt-32 px-8 text-center">Movie not found on ADNFLIX.</div>
    );

  const title = movie.title || (movie as any).name;
  const releaseDate = movie.release_date || (movie as any).first_air_date;

  return (
    <div className="min-h-screen">
      <VideoModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
      <PersonModal
        personId={selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
      />
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-bg-main/75 backdrop-blur-xl"
            onClick={handleCloseReviewModal}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative z-10 w-full max-w-3xl rounded-[2rem] border border-white/10 bg-card-bg/95 p-8 shadow-skeuo-lg backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/80 mb-2">
                  Add a review
                </p>
                <h2 className="text-3xl font-bold text-text-main">
                  Share your thoughts on {title}
                </h2>
              </div>
              <button
                onClick={handleCloseReviewModal}
                className="rounded-full p-3 bg-card-bg border border-white/10 text-text-main/60 hover:text-primary transition-all"
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main/80">
                  Your review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={6}
                  placeholder="Write what you loved, what stood out, or why this movie deserves a rewatch."
                  className="w-full min-h-[170px] rounded-3xl border border-text-main/10 bg-bg-main/70 px-5 py-4 text-text-main outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-text-main/80">
                  Rating
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className={cn(
                        "rounded-full p-3 transition-all border border-white/10",
                        reviewRating >= value
                          ? "bg-primary text-white"
                          : "bg-card-bg text-text-main/50 hover:bg-card-bg/90",
                      )}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  ))}
                  <span className="text-sm font-medium text-text-main/70">
                    {reviewRating}.0 / 5
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleCloseReviewModal}
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-text-main/10 text-text-main hover:border-primary/40 hover:text-primary transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReview}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-white font-bold hover:scale-[1.01] transition-all"
                >
                  Publish Review
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <CastOverlay
        isOpen={isCastOverlayOpen}
        movieTitle={title}
        cast={cast}
        onClose={() => setIsCastOverlayOpen(false)}
        onPersonClick={(id) => {
          setIsCastOverlayOpen(false);
          handlePersonClick(id);
        }}
      />
      {/* Hero Header */}
      <div className="relative h-[60vh] md:h-[75vh] lg:h-[85vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={`${TMDB_CONFIG.IMG_BASE_URL}${TMDB_CONFIG.BACKDROP_SIZE}${movie.backdrop_path}`}
            alt={title}
            className="w-full h-full object-cover object-[center_25%]"
            referrerPolicy="no-referrer"
          />
          {theme === "dark" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-bg-main/40 via-transparent to-transparent" />
            </>
          )}
        </div>

        <div className="relative z-10 max-w-screen-2xl mx-auto h-full flex flex-col justify-end p-4 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 rounded bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold uppercase tracking-wider">
                Powered by ADNFLIX
              </span>
              {movie.tagline && (
                <span className="text-text-main/60 italic text-sm">
                  "{movie.tagline}"
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              {title}
            </h1>

            {/* Key Metrics */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-text-main/80 font-medium mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold">
                <Star className="w-4 h-4 fill-current" />
                <span>{movie.vote_average.toFixed(1)} IMDb Score</span>
              </div>
              {mediaType === "movie" ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{movie.runtime} min</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{(movie as any).number_of_seasons} Seasons</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formatDate(releaseDate)}</span>
              </div>
              {movie.homepage && (
                <a
                  href={movie.homepage}
                  target="_blank"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Poster & Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative skeuo-card p-2 overflow-hidden aspect-[2/3]"
              >
                <img
                  src={`${TMDB_CONFIG.IMG_BASE_URL}${TMDB_CONFIG.POSTER_SIZES.large}${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>
          </div>

          {/* Right Column: Info & Cast */}
          <div className="lg:col-span-2">
            <section className="mb-8 md:mb-12">
              <h2 className="text-xl font-bold mb-4 opacity-50 uppercase tracking-widest text-sm text-text-main">
                Synopsis
              </h2>
              <p className="text-base md:text-lg text-text-main/80 leading-relaxed first-letter:text-4xl first-letter:font-bold first-letter:text-primary first-letter:mr-1 first-letter:float-left">
                {movie.overview}
              </p>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button
                  onClick={handleWatchTrailer}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:scale-105 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> Trailer
                </button>
                <button
                  onClick={toggleWatchlist}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer",
                    isInWatchlist
                      ? "bg-primary border-primary text-white"
                      : "bg-card-bg border-text-main/10 text-text-main hover:bg-primary/5",
                  )}
                >
                  {isInWatchlist ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isInWatchlist ? "In Watchlist" : "Watchlist"}
                </button>
                <button
                  onClick={handleAddReview}
                  className="p-2.5 rounded-xl bg-card-bg border border-text-main/10 text-text-main hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                  title="Add Review"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleFavorites}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all cursor-pointer",
                    isInFavorites
                      ? "bg-primary border-primary text-white"
                      : "bg-card-bg border-text-main/10 text-text-main hover:text-primary hover:border-primary/30",
                  )}
                  title={
                    isInFavorites ? "Remove from Favorites" : "Add to Favorites"
                  }
                >
                  <Heart
                    className={cn("w-5 h-5", isInFavorites && "fill-current")}
                  />
                </button>
              </div>
            </section>

            {/* Metrics Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 md:mb-12">
              {[
                { label: "Budget", value: formatCurrency(movie.budget || 0) },
                { label: "Revenue", value: formatCurrency(movie.revenue || 0) },
                { label: "Status", value: "Released" },
                { label: "Language", value: "English" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="skeuo-card bg-card-bg p-4 flex flex-col items-center justify-center text-center"
                >
                  <span className="text-[10px] uppercase tracking-tighter text-text-main/40 mb-1">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-text-main/90">
                    {item.value === "$0" ? "N/A" : item.value}
                  </span>
                </div>
              ))}
            </section>

            {/* Cast Section */}
            <section className="mb-8 md:mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Top Cast</h2>
                <Link
                  to={`/movies/${movie.id}/cast`}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  View All
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {cast.slice(0, 10).map((person) => (
                  <Link
                    key={person.id}
                    to={`/person/${person.id}`}
                    className="flex-shrink-0 w-28 group cursor-pointer"
                  >
                    <div className="w-28 h-36 rounded-xl overflow-hidden mb-2 skeuo-card border-none shadow-sm group-hover:shadow-skeuo-md transition-all">
                      {person.profile_path ? (
                        <img
                          src={`${TMDB_CONFIG.IMG_BASE_URL}/w185${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-card-bg flex items-center justify-center text-text-main/20">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold truncate">{person.name}</p>
                    <p className="text-[10px] text-text-main/40 truncate">
                      {person.character}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Similar Movies */}
            <section>
              <h2 className="text-2xl font-bold mb-6">
                More Like This on{" "}
                <span className="text-primary italic">ADNFLIX</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {similar.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

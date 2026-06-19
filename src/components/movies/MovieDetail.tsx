/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
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
  Film,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { Movie, Cast, Review, Comment } from "@/src/types";
import { TMDB_CONFIG, GENRES } from "@/src/constants";
import { formatCurrency, formatDate, cn, buildCommentTree, addCommentToTree } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import MovieCard from "./MovieCard";
import VideoModal from "../layout/VideoModal";
import PersonModal from "./PersonModal";
import CastOverlay from "./CastOverlay";
import { useTheme } from "@/src/lib/ThemeContext";
import { getAuthToken } from "@/src/lib/authSession";
import CommentSection from "../layout/CommentSection";

interface MovieVideo {
  key: string;
  site: string;
  type: string;
}

export default function MovieDetail() {
  const { id } = useParams();
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get("type") || "movie";
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const token = getAuthToken();
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
    const syncState = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsInWatchlist(false);
        setIsInFavorites(false);
        return;
      }

      try {
        const movieId = movie?.id || parseInt(id || "0");
        const [watchlistRes, favoritesRes] = await Promise.all([
          fetch("/api/user-movies/watchlist", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/user-movies/favorite", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const [watchlistData, favoritesData] = await Promise.all([
          watchlistRes.json(),
          favoritesRes.json(),
        ]);
        const watchlistIds = new Set(
          watchlistData.map((item: any) => Number(item.tmdb_movie_id)),
        );
        const favoritesIds = new Set(
          favoritesData.map((item: any) => Number(item.tmdb_movie_id)),
        );
        setIsInWatchlist(watchlistIds.has(movieId));
        setIsInFavorites(favoritesIds.has(movieId));
      } catch (error) {
        console.error("Failed to sync movie detail saved lists", error);
      }
    };

    syncState();
    window.addEventListener("adnflix_sync", syncState);

    return () => {
      window.removeEventListener("adnflix_sync", syncState);
    };
  }, [id, movie?.id]);

  useEffect(() => {
    const fetchWithTimeout = async (url: string, timeout = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } finally {
        clearTimeout(id);
      }
    };

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [movieData, castData, similarData] = await Promise.all([
          fetchWithTimeout(`/api/movies/${id}?type=${mediaType}`),
          fetchWithTimeout(`/api/movies/${mediaType}/${id}/credits`),
          fetchWithTimeout(`/api/movies/${mediaType}/${id}/recommendations`),
        ]);
        setMovie(movieData);
        setCast(castData.cast || []);
        setSimilar(
          similarData.results?.length > 0
            ? similarData.results.slice(0, 6)
            : [],
        );
      } catch (err) {
        console.error("Failed to load movie details:", err);
        window.dispatchEvent(
          new CustomEvent("adnflix_toast", {
            detail: { message: "Failed to load movie details. Please try again later." },
          }),
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, mediaType]);

  // Track History
  useEffect(() => {
    const trackHistory = async () => {
      if (!movie) return;
      const token = getAuthToken();
      if (!token) return;

      try {
        await fetch("/api/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tmdb_movie_id: movie.id,
            movie_title: movie.title || (movie as any).name || "Unknown",
            media_type: mediaType,
          }),
        });
        window.dispatchEvent(new Event("adnflix_sync"));
      } catch (err) {
        console.error("Failed to track history on server", err);
      }
    };
    trackHistory();
  }, [movie, mediaType]);

  const fetchMovieReviews = async () => {
    try {
      const movieId = movie?.id || parseInt(id || "0");
      const res = await fetch(`/api/movies/${movieId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        
        if (!Array.isArray(data)) {
          console.error("Expected array of reviews, got:", data);
          setReviews([]);
          return;
        }

        const reviewsWithComments = await Promise.all(
          data.map(async (review: any) => {
            try {
              const commentsRes = await fetch(
                `/api/reviews/${review.id}/comments`
              );
              const commentsData: Comment[] = commentsRes.ok ? await commentsRes.json() : [];
              
              return { 
                ...review, 
                comments: buildCommentTree(commentsData), 
                isCommentsExpanded: false,
                totalCommentCount: commentsData.length
              };
            } catch {
              return { ...review, comments: [], isCommentsExpanded: false, totalCommentCount: 0 };
            }
          })
        );
        setReviews(reviewsWithComments);
      }
    } catch (err) {
      console.error("Failed to fetch movie reviews", err);
    }
  };

  useEffect(() => {
    if (movie?.id || id) {
      fetchMovieReviews();
    }
  }, [movie?.id, id]);

  const onCommentAdded = (reviewId: number, newComment: Comment) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            comments: addCommentToTree(r.comments || [], newComment),
            isCommentsExpanded: true,
            totalCommentCount: (r.totalCommentCount || 0) + 1
          };
        }
        return r;
      })
    );
  };

  const toggleComments = (reviewId: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, isCommentsExpanded: !r.isCommentsExpanded } : r
      )
    );
  };

  const handleAddReview = () => {
    if (!movie) return;
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    setIsReviewModalOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveReview = async () => {
    if (!movie || !reviewText.trim()) {
      if (!reviewText.trim()) {
        window.dispatchEvent(
          new CustomEvent("adnflix_toast", {
            detail: { message: "Please write something before publishing." },
          }),
        );
      }
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const movieTitle = movie.title || (movie as any).name || "Unknown Movie";

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tmdb_movie_id: movie.id,
          movie_title: movieTitle,
          rating: reviewRating,
          review_text: reviewText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save review");
      }

      setIsReviewModalOpen(false);
      setReviewText("");
      setReviewRating(5);
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "Review published successfully!" },
        }),
      );
      fetchMovieReviews();
    } catch (err: any) {
      console.error("Error saving review:", err);
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: err.message || "Failed to publish review. Please try again." },
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewText("");
    setReviewRating(5);
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const toggleWatchlist = async () => {
    if (!movie) return;
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const movieTitle = movie.title || (movie as any).name || "Unknown Movie";

    try {
      if (isInWatchlist) {
        const res = await fetch(`/api/user-movies/watchlist/${movie.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setIsInWatchlist(false);
          window.dispatchEvent(
            new CustomEvent("adnflix_toast", {
              detail: { message: "Removed from Watchlist" },
            }),
          );
        }
      } else {
        const res = await fetch("/api/user-movies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tmdb_movie_id: movie.id,
            movie_title: movieTitle,
            type: "watchlist",
            genre_ids: movie.genre_ids,
          }),
        });
        if (res.ok) {
          setIsInWatchlist(true);
          window.dispatchEvent(
            new CustomEvent("adnflix_toast", {
              detail: { message: "Added to Watchlist" },
            }),
          );
        }
      }
      window.dispatchEvent(new Event("adnflix_sync"));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorites = async () => {
    if (!movie) return;
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const movieTitle = movie.title || (movie as any).name || "Unknown Movie";

    try {
      if (isInFavorites) {
        const res = await fetch(`/api/user-movies/favorite/${movie.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setIsInFavorites(false);
          window.dispatchEvent(
            new CustomEvent("adnflix_toast", {
              detail: { message: "Removed from Favorites" },
            }),
          );
        }
      } else {
        const res = await fetch("/api/user-movies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tmdb_movie_id: movie.id,
            movie_title: movieTitle,
            type: "favorite",
            genre_ids: movie.genre_ids,
          }),
        });
        if (res.ok) {
          setIsInFavorites(true);
          window.dispatchEvent(
            new CustomEvent("adnflix_toast", {
              detail: { message: "Added to Favorites" },
            }),
          );
        }
      }
      window.dispatchEvent(new Event("adnflix_sync"));
    } catch (err) {
      console.error(err);
    }
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

  const totalInteractions = reviews.reduce(
    (acc, rev) => acc + 1 + (rev.totalCommentCount || 0),
    0
  );

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
                  disabled={isSubmitting}
                  className={cn(
                    "w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-white font-bold transition-all",
                    isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.01] cursor-pointer"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </div>
                  ) : (
                    "Publish Review"
                  )}
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
                <span>{typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : (typeof movie.vote_average === 'string' && !isNaN(parseFloat(movie.vote_average)) ? parseFloat(movie.vote_average).toFixed(1) : "0.0")} IMDb Score</span>
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
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-primary" />
                  <span>
                    {movie.genres
                      .slice(0, 3)
                      .map((g: any) => g.name)
                      .join(", ")}
                  </span>
                </div>
              )}
              {movie.homepage && (
                <a
                  href={movie.homepage}
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:text-primary transition-all group"
                >
                  <Globe className="w-4 h-4 text-text-main/40 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-main/60 group-hover:text-text-main">Website</span>
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
                <button
                  onClick={scrollToReviews}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-text-main/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer group/disc"
                >
                  <MessageSquare className="w-4 h-4 text-primary group-hover/disc:scale-110 transition-transform" />
                  {totalInteractions} Discussions
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
                  className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-text-main/40 hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer"
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

            {/* Reviews & Comments Section */}
            <section ref={reviewsRef} className="mb-8 md:mb-12 scroll-mt-24">
              <div className="relative mb-8 p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 via-card-bg/50 to-bg-main border border-primary/20 shadow-skeuo-sm overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-all duration-700" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                        Community Discourse
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-white">User Reviews</h2>
                    <p className="text-sm text-text-main/50 max-w-sm leading-relaxed">
                      What's your take on this cinema? Share your thoughts and join the conversation.
                    </p>
                  </div>

                  <button
                    onClick={handleAddReview}
                    className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group/btn"
                  >
                    <MessageCircle className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                    Write a Review
                  </button>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-6 rounded-2xl bg-card-bg/40 border border-text-main/10 shadow-skeuo-sm flex flex-col gap-4 relative overflow-hidden group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white">
                              {rev.user_name || "Anonymous Movie Buff"}
                            </span>
                            <p className="text-[9px] text-text-main/30 font-bold uppercase mt-0.5">
                              {new Date(rev.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-3 h-3",
                                star <= rev.rating
                                  ? "fill-primary text-primary"
                                  : "text-text-main/20",
                              )}
                            />
                          ))}
                          <span className="ml-1.5 text-[10px] font-bold text-primary">
                            {rev.rating}.0
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-text-main/80 leading-relaxed italic pl-1">
                        "{rev.review_text}"
                      </p>

                      <div className="border-t border-text-main/5 pt-3 flex flex-col gap-3">
                        <button
                          onClick={() => toggleComments(rev.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-text-main/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer self-start group/cbtn"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-primary group-hover/cbtn:scale-110 transition-transform" />
                          <span>
                            {rev.totalCommentCount || 0}{" "}
                            {rev.totalCommentCount === 1 ? "Comment" : "Comments"}
                          </span>
                          {rev.isCommentsExpanded ? (
                            <ChevronUp className="w-3 h-3 opacity-40" />
                          ) : (
                            <ChevronDown className="w-3 h-3 opacity-40" />
                          )}
                        </button>

                        <AnimatePresence>
                          {rev.isCommentsExpanded && (
                            <CommentSection 
                              reviewId={rev.id} 
                              comments={rev.comments || []} 
                              onCommentAdded={(newComment) => onCommentAdded(rev.id, newComment)} 
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="skeuo-card bg-card-bg/20 p-8 text-center text-text-main/35 italic">
                  No reviews posted yet. Be the first to share your thoughts on this movie!
                </div>
              )}
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

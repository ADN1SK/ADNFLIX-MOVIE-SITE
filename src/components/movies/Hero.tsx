/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Plus,
  Info,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Tv,
  TrendingUp,
} from "lucide-react";
import { Movie } from "@/src/types";
import { TMDB_CONFIG } from "@/src/constants";
import { cn } from "@/src/lib/utils";
import { Link } from "react-router-dom";
import VideoModal from "../layout/VideoModal";
import { useTheme } from "@/src/lib/ThemeContext";
import { getAuthToken } from "@/src/lib/authSession";

interface HeroProps {
  movies: Movie[];
}

interface MovieVideo {
  key: string;
  site: string;
  type: string;
}

export default function Hero({ movies }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const movie = movies[activeIndex];
  const mediaType = movie.media_type || ((movie as any).name ? "tv" : "movie");
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const { theme } = useTheme();
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies.length]);

  useEffect(() => {
    const syncState = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsInWatchlist(false);
        return;
      }
      try {
        const res = await fetch("/api/user-movies/watchlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setIsInWatchlist(
          data.some((item: any) => Number(item.tmdb_movie_id) === movie.id),
        );
      } catch (error) {
        console.error("Failed to sync hero watchlist", error);
      }
    };

    syncState();
    window.addEventListener("adnflix_sync", syncState);

    return () => {
      window.removeEventListener("adnflix_sync", syncState);
    };
  }, [movie.id]);

  const toggleWatchlist = async () => {
    const token = getAuthToken();
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "Please log in to manage saved movies" },
        }),
      );
      return;
    }

    try {
      if (isInWatchlist) {
        await fetch(`/api/user-movies/watchlist/${movie.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsInWatchlist(false);
      } else {
        await fetch("/api/user-movies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tmdb_movie_id: movie.id,
            movie_title: movie.title || (movie as any).name,
            type: "watchlist",
          }),
        });
        setIsInWatchlist(true);
      }
      window.dispatchEvent(new Event("adnflix_sync"));
    } catch (error) {
      console.error("Failed to update hero watchlist", error);
    }
  };

  const handleWatchTrailer = async () => {
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
      console.error("Failed to fetch trailer:", err);
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "Could not load trailer at this time" },
        }),
      );
    }
  };

  return (
    <>
      <VideoModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
      <div className="relative group w-full h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <motion.img
                src={`${TMDB_CONFIG.IMG_BASE_URL}${TMDB_CONFIG.BACKDROP_SIZE}${movie.backdrop_path}`}
                alt={movie.title}
                initial={{ scale: 1 }}
                animate={{ scale: 1.1 }}
                transition={{ duration: 12, ease: "linear" }}
                className="w-full h-full object-cover"
                fetchPriority="high"
                referrerPolicy="no-referrer"
              />
              {/* Gradients: Only rendered in Dark mode to avoid hazy effect in light mode */}
              {theme === "dark" && (
                <>
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-bg-main/90 via-bg-main/20 to-transparent"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-bg-main/40 to-transparent"
                    aria-hidden="true"
                  />
                </>
              )}
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-screen-2xl mx-auto w-full px-4 md:px-8 mt-10 md:mt-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="max-w-2xl"
              >
                {/* Badge */}
                <div className="flex items-center gap-2 mb-6">
                  {activeIndex < 3 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2 py-0.5 rounded bg-gold text-black text-[10px] font-black tracking-widest uppercase flex items-center gap-1 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    >
                      <TrendingUp className="w-3 h-3" />
                      Most Popular #{activeIndex + 1}
                    </motion.div>
                  )}
                  <div className="px-2 py-0.5 rounded bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold tracking-widest uppercase">
                    ADNFLIX Spotlight
                  </div>
                  <div className="flex items-center h-5 gap-1 text-gold text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                  {mediaType === "tv" && (
                    <div className="flex items-center h-5 gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-main/60 text-[10px] font-bold uppercase tracking-widest">
                      <Tv className="w-3 h-3 text-primary" />
                      <span>
                        {(movie as any).number_of_seasons
                          ? `${(movie as any).number_of_seasons} Seasons`
                          : "TV Series"}
                      </span>
                    </div>
                  )}
                </div>

                <h1 className="text-4xl md:text-7xl font-bold mb-4 tracking-tight leading-none">
                  {movie.title || (movie as any).name}
                </h1>

                <p className="text-lg text-text-main/70 mb-8 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl">
                  {movie.overview}
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleWatchTrailer}
                    className="px-8 py-3.5 rounded-full bg-primary text-white font-bold flex items-center gap-2 hover:scale-105 hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Watch Trailer
                  </button>
                  <button
                    onClick={toggleWatchlist}
                    className={cn(
                      "px-6 py-3.5 rounded-full backdrop-blur-md border font-bold flex items-center gap-2 transition-all cursor-pointer",
                      isInWatchlist
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "bg-card-bg/20 border-text-main/20 text-text-main hover:bg-card-bg/40",
                    )}
                  >
                    {isInWatchlist ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {isInWatchlist ? "In Watchlist" : "Watchlist"}
                  </button>
                  <Link
                    to={`/movies/${movie.id}?type=${mediaType}`}
                    className="px-6 py-3.5 rounded-full border border-text-main/20 text-text-main font-bold flex items-center gap-2 hover:bg-card-bg/5 transition-all cursor-pointer"
                  >
                    <Info className="w-5 h-5" />
                    Details
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Side Decorative Element */}
            <div className="absolute right-0 bottom-0 p-8 hidden lg:block opacity-20 pointer-events-none">
              <span
                className={cn(
                  "text-[12rem] font-bold text-white tracking-tighter leading-none select-none",
                  theme === "dark" &&
                    "drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]",
                )}
              >
                {(activeIndex + 1).toString().padStart(2, "0")}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "h-1.5 transition-all duration-300 rounded-full cursor-pointer",
                activeIndex === idx
                  ? "w-8 bg-primary"
                  : "w-2 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-20 pointer-events-none">
          <button
            onClick={() =>
              setActiveIndex(
                (prev) => (prev - 1 + movies.length) % movies.length,
              )
            }
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all cursor-pointer pointer-events-auto opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % movies.length)}
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all cursor-pointer pointer-events-auto opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>
    </>
  );
}

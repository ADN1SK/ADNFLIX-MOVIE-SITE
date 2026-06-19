/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Star, Plus, Heart, ArrowRight, Check } from "lucide-react";
import { Movie } from "@/src/types";
import { TMDB_CONFIG } from "@/src/constants";
import { GENRES } from "@/src/constants";
import { cn } from "@/src/lib/utils";
import { Link } from "react-router-dom";
import { decodeJwtPayload, getAuthToken } from "@/src/lib/authSession";

interface MovieCardProps {
  movie: Movie;
  className?: string;
  onClick?: () => void;
}

export default function MovieCard({
  movie,
  className,
  onClick,
}: MovieCardProps) {
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
        console.info("[MOVIE_CARD] syncing saved lists", {
          userId: Number(localStorage.getItem("adnflix_user_id") || 0) || null,
          jwtPayload: decodeJwtPayload(token),
          requestUrl: "/api/user-movies/watchlist",
        });
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
        setIsInWatchlist(watchlistIds.has(movie.id));
        setIsInFavorites(favoritesIds.has(movie.id));
      } catch (error) {
        console.error("Failed to sync movie card saved lists", error);
      }
    };

    syncState();
    window.addEventListener("adnflix_sync", syncState);

    return () => {
      window.removeEventListener("adnflix_sync", syncState);
    };
  }, [movie.id]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
            genre_ids: movie.genre_ids,
          }),
        });
        setIsInWatchlist(true);
      }
      window.dispatchEvent(new Event("adnflix_sync"));
    } catch (error) {
      console.error("Failed to update watchlist", error);
    }
  };

  const toggleFavorites = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      if (isInFavorites) {
        await fetch(`/api/user-movies/favorite/${movie.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsInFavorites(false);
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
            type: "favorite",
            genre_ids: movie.genre_ids,
          }),
        });
        setIsInFavorites(true);
      }
      window.dispatchEvent(new Event("adnflix_sync"));
    } catch (error) {
      console.error("Failed to update favorites", error);
    }
  };

  const ratingColor =
    movie.vote_average >= 7.5
      ? "text-gold"
      : movie.vote_average >= 5
        ? "text-slate-400"
        : "text-amber-800";

  const mediaType = movie.media_type || ((movie as any).name ? "tv" : "movie");

  const trackHistory = async () => {
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
      console.error("Failed to track history on click", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover="hover"
      viewport={{ once: true }}
      className={cn(
        "group relative w-full aspect-[2/3] skeuo-card overflow-hidden cursor-pointer",
        className,
      )}
    >
      <Link
        to={`/movies/${movie.id}?type=${mediaType}`}
        className="absolute inset-0 z-10"
        onClick={(e) => {
          trackHistory();
          if (onClick) onClick();
        }}
      />

      {/* Poster Image */}
      <img
        src={`${TMDB_CONFIG.IMG_BASE_URL}${TMDB_CONFIG.POSTER_SIZES.medium}${movie.poster_path}`}
        alt={movie.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />

      {/* Overlay Content */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20 pointer-events-none">
        {/* Quick Actions */}
        <div className="flex gap-2 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 pointer-events-auto">
          <button
            onClick={toggleWatchlist}
            className={cn(
              "p-2 rounded-full backdrop-blur-md border transition-colors cursor-pointer",
              isInWatchlist
                ? "bg-primary border-primary shadow-[0_0_10px_rgba(229,9,20,0.4)]"
                : "bg-card-bg/20 border-text-main/20 hover:bg-primary/80",
            )}
            title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            {isInWatchlist ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <Plus className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={toggleFavorites}
            className={cn(
              "p-2 rounded-full backdrop-blur-md border transition-colors cursor-pointer",
              isInFavorites
                ? "bg-primary border-primary shadow-[0_0_10px_rgba(229,9,20,0.4)]"
                : "bg-card-bg/20 border-text-main/20 hover:bg-primary/80",
            )}
            title={isInFavorites ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={cn(
                "w-5 h-5 text-white",
                isInFavorites && "fill-current",
              )}
            />
          </button>
          <Link
            to={`/movies/${movie.id}?type=${mediaType}`}
            className="p-2 rounded-full bg-primary backdrop-blur-md border border-white/20 hover:scale-110 transition-transform flex items-center justify-center flex-1 pointer-events-auto"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </Link>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold mb-1 text-text-main">
          {movie.title || (movie as any).name || "Untitled"}
        </h3>
        {movie.genre_ids && (
          <p className="text-[10px] text-text-main/50 font-medium mb-1 truncate">
            {movie.genre_ids
              .slice(0, 2)
              .map((id) => GENRES.find((g) => g.id === id)?.name)
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        <div className="flex items-center gap-1.5">
          <Star className={cn("w-3.5 h-3.5 fill-current", ratingColor)} />
          <span className={cn("text-xs font-bold font-mono", ratingColor)}>
            {(movie.vote_average ?? 0).toFixed(1)}
          </span>
          <span className="text-[10px] text-text-main/40 font-mono ml-auto">
            {
              (movie.release_date || (movie as any).first_air_date)?.split(
                "-",
              )[0]
            }
          </span>
        </div>
      </div>

      {/* Type Badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 z-20">
        <span className="text-[9px] font-black uppercase tracking-tighter text-white/90">
          {mediaType === "tv" ? "TV Series" : "Movie"}
        </span>
      </div>

      {/* Rating Badge (Always visible) */}
      <div className="absolute top-2 right-2 flex items-center z-20 shadow-md transition-transform">
        {movie.vote_average >= 8.0 && (
          <motion.div
            variants={{
              initial: { x: 15, opacity: 0, width: 0 },
              hover: { x: 0, opacity: 1, width: "auto" },
            }}
            initial="initial"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative bg-[#f5c518] text-black text-[9px] font-black px-1.5 py-1 rounded-l-md leading-none self-stretch flex items-center border border-[#f5c518] border-r-0 whitespace-nowrap overflow-hidden"
          >
            {/* Gold Sparkle Effect for Top 250 */}
            {movie.vote_average >= 8.5 && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer pointer-events-none" />
            )}
            <span className="relative z-10">
              {movie.vote_average >= 8.5 ? "IMDb Top 250" : "IMDb"}
            </span>
          </motion.div>
        )}
        <div
          className={cn(
            "px-2 py-1 bg-bg-main/90 backdrop-blur-md border border-text-main/10 flex items-center gap-1",
            movie.vote_average >= 8.0
              ? "rounded-r-md border-l-0"
              : "rounded-md",
          )}
        >
          <Star className={cn("w-3 h-3 fill-current", ratingColor)} />
          <span className={cn("text-[10px] font-bold", ratingColor)}>
            {(movie.vote_average ?? 0).toFixed(1)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

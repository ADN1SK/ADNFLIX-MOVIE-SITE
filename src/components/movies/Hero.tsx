/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Play, Plus, Info, Star } from "lucide-react";
import { Movie } from "@/src/types";
import { TMDB_CONFIG } from "@/src/constants";
import { Link } from "react-router-dom";
import VideoModal from "../layout/VideoModal";

interface HeroProps {
  movie: Movie;
}

interface MovieVideo {
  key: string;
  site: string;
  type: string;
}

export default function Hero({ movie }: HeroProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const handleWatchTrailer = async () => {
    try {
      const res = await fetch(`/api/movies/movie/${movie.id}/videos`);
      const data = await res.json();
      const trailer = data.results?.find(
        (v: MovieVideo) => v.type === "Trailer" && v.site === "YouTube",
      );
      if (trailer) {
        setTrailerKey(trailer.key);
      } else {
        alert("Trailer not available for this title.");
      }
    } catch (err) {
      console.error("Failed to fetch trailer:", err);
      alert("Could not load trailer at this time.");
    }
  };

  return (
    <>
      <VideoModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
      <div className="relative w-full h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={`${TMDB_CONFIG.IMG_BASE_URL}${TMDB_CONFIG.BACKDROP_SIZE}${movie.backdrop_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-screen-2xl mx-auto w-full px-4 md:px-8 mt-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="px-2 py-0.5 rounded bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(229,9,20,0.3)]">
                ADNFLIX Spotlight
              </div>
              <div className="flex items-center gap-1 text-gold text-sm font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{movie.vote_average.toFixed(1)}</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-none">
              {movie.title}
            </h1>

            <p className="text-lg text-cream/70 mb-8 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl">
              {movie.overview}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleWatchTrailer}
                className="px-8 py-3.5 rounded-full bg-primary text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Trailer
              </button>
              <button
                onClick={() =>
                  alert(`"${movie.title}" added to your watchlist!`)
                }
                className="px-6 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold flex items-center gap-2 hover:bg-white/20 transition-all"
              >
                <Plus className="w-5 h-5" />
                Watchlist
              </button>
              <Link
                to={`/movies/${movie.id}`}
                className="px-6 py-3.5 rounded-full border border-white/20 text-white font-bold flex items-center gap-2 hover:bg-white/5 transition-all"
              >
                <Info className="w-5 h-5" />
                Details
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Side Decorative Element */}
        <div className="absolute right-0 bottom-0 p-8 hidden lg:block opacity-20">
          <span className="text-[12rem] font-bold text-white tracking-tighter leading-none select-none">
          
          </span>
        </div>
      </div>
    </>
  );
}

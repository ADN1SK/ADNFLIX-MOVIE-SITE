/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Star, Plus, Heart, ArrowRight } from "lucide-react";
import { Movie } from "@/src/types";
import { TMDB_CONFIG, ADNFLIX_CONFIG } from "@/src/constants";
import { cn } from "@/src/lib/utils";
import { Link } from "react-router-dom";

interface MovieCardProps {
  movie: Movie;
  className?: string;
  key?: React.Key;
}

export default function MovieCard({ movie, className }: MovieCardProps) {
  const ratingColor = 
    movie.vote_average >= 7.5 ? "text-gold" : 
    movie.vote_average >= 5 ? "text-slate-400" : 
    "text-amber-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("group relative w-full aspect-[2/3] skeuo-card overflow-hidden cursor-pointer", className)}
    >
      <Link to={`/movies/${movie.id}`} className="absolute inset-0 z-10" />

      {/* Poster Image */}
      <img
        src={`${TMDB_CONFIG.IMG_BASE_URL}${TMDB_CONFIG.POSTER_SIZES.medium}${movie.poster_path}`}
        alt={movie.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />

      {/* Overlay Content */}
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20 pointer-events-none">
        {/* Quick Actions */}
        <div className="flex gap-2 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 pointer-events-auto">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-primary/80 transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-primary/80 transition-colors"
          >
            <Heart className="w-5 h-5 text-white" />
          </button>
          <div className="p-2 rounded-full bg-primary backdrop-blur-md border border-white/20 hover:scale-110 transition-transform flex items-center justify-center flex-1">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold mb-1 text-white">{movie.title}</h3>
        
        <div className="flex items-center gap-1.5">
          <Star className={cn("w-3.5 h-3.5 fill-current", ratingColor)} />
          <span className={cn("text-xs font-bold font-mono", ratingColor)}>
            {movie.vote_average.toFixed(1)}
          </span>
          <span className="text-[10px] text-cream/40 font-mono ml-auto">
            {movie.release_date?.split("-")[0]}
          </span>
        </div>
      </div>

      {/* Rating Badge (Always visible) */}
      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-midnight/80 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-md z-20">
        <Star className={cn("w-3 h-3 fill-current", ratingColor)} />
        <span className={cn("text-[10px] font-bold", ratingColor)}>
          {movie.vote_average.toFixed(1)}
        </span>
      </div>
    </motion.div>
  );
}

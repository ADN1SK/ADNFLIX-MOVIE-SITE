/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  Clock,
  Calendar,
  Globe,
  Play,
  Plus,
  User,
} from "lucide-react";
import { Movie, Cast } from "@/src/types";
import { TMDB_CONFIG } from "@/src/constants";
import { formatCurrency, formatDate } from "@/src/lib/utils";
import { motion } from "motion/react";
import MovieCard from "./MovieCard";
import VideoModal from "../layout/VideoModal";

interface MovieVideo {
  key: string;
  site: string;
  type: string;
}

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [movieData, castData, similarData] = await Promise.all([
          fetch(`/api/movies/movie/${id}`).then((r) => r.json()),
          fetch(`/api/movies/movie/${id}/credits`).then((r) => r.json()),
          fetch(`/api/movies/movie/${id}/recommendations`).then((r) =>
            r.json(),
          ),
        ]);
        setMovie(movieData);
        setCast(castData.cast?.slice(0, 10) || []);
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
  }, [id]);

  const handleWatchTrailer = async () => {
    if (!movie) return;
    try {
      const res = await fetch(`/api/movies/movie/${movie.id}/videos`);
      const data = await res.json();
      const trailer = data.results?.find(
        (v: MovieVideo) => v.type === "Trailer" && v.site === "YouTube",
      );
      if (trailer) {
        setTrailerKey(trailer.key);
      } else {
        alert("Trailer not available.");
      }
    } catch (err) {
      console.error(err);
    }
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

  return (
    <div className="min-h-screen">
      <VideoModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
      {/* Hero Header */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={`${TMDB_CONFIG.IMG_BASE_URL}${TMDB_CONFIG.BACKDROP_SIZE}${movie.backdrop_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-transparent to-transparent" />
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
                <span className="text-cream/60 italic text-sm">
                  "{movie.tagline}"
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              {movie.title}
            </h1>

            {/* Key Metrics */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-cream/80 font-medium mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Star className="w-4 h-4 fill-current" />
                <span>{movie.vote_average.toFixed(1)} ADNFLIX Score</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{movie.runtime} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formatDate(movie.release_date)}</span>
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

                {/* Action Buttons Overlay */}
                <div className="absolute inset-x-2 top-2 p-6 pb-12 bg-gradient-to-b from-bg-main/95 via-bg-main/40 to-transparent rounded-t-lg flex flex-col justify-start">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleWatchTrailer}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" /> Trailer
                    </button>
                    <button
                      onClick={() => alert("Added to your watchlist!")}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-xs hover:bg-white/20 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Watchlist
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Info & Cast */}
          <div className="lg:col-span-2">
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-4 opacity-50 uppercase tracking-widest text-sm">
                Synopsis
              </h2>
              <p className="text-lg text-cream/80 leading-relaxed first-letter:text-4xl first-letter:font-bold first-letter:text-primary first-letter:mr-1 first-letter:float-left">
                {movie.overview}
              </p>
            </section>

            {/* Metrics Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: "Budget", value: formatCurrency(movie.budget || 0) },
                { label: "Revenue", value: formatCurrency(movie.revenue || 0) },
                { label: "Status", value: "Released" },
                { label: "Language", value: "English" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="skeuo-card p-4 flex flex-col items-center justify-center text-center"
                >
                  <span className="text-[10px] uppercase tracking-tighter text-cream/40 mb-1">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-cream/90">
                    {item.value === "$0" ? "N/A" : item.value}
                  </span>
                </div>
              ))}
            </section>

            {/* Cast Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Top Cast</h2>
                <button
                  onClick={() => alert("Full cast list feature coming soon!")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {cast.map((person) => (
                  <div
                    key={person.id}
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
                    <p className="text-[10px] text-cream/40 truncate">
                      {person.character}
                    </p>
                  </div>
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Movie } from "@/src/types";
import MovieCard from "@/src/components/movies/MovieCard";
import { Film, Info } from "lucide-react";
import { motion } from "motion/react";

export default function GenrePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const genreName = searchParams.get("name") || id;
  const selectedYear = searchParams.get("year");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenreMovies = async () => {
      setLoading(true);
      try {
        // Correct TMDB endpoint for genre discovery
        const yearParam = selectedYear
          ? `&primary_release_year=${selectedYear}`
          : "";
        const endpoint = id
          ? `/api/movies/discover/movie?with_genres=${id}${yearParam}`
          : `/api/movies/movie/popular`;
        
        const res = await fetch(endpoint);
        const data = await res.json();
        setMovies(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGenreMovies();
    window.scrollTo(0, 0);
  }, [id, selectedYear]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-bg-main pt-20">
       <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
           <div>
              <div className="flex items-center gap-3 mb-2">
                <Film className="w-6 h-6 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight uppercase">
                  {genreName} {selectedYear ? selectedYear : ""} Cinema
                </h1>
              </div>
              <p className="text-text-main/40 uppercase tracking-widest text-[10px] font-bold">Discovering {genreName} on ADNFLIX</p>
           </div>
           <div className="hidden md:flex items-center gap-2 group cursor-help text-text-main/20 hover:text-primary transition-colors">
              <Info className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-tighter">AI Curated List</span>
           </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((movie, idx) => (
             <motion.div
               key={movie.id}
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.05 }}
             >
               <MovieCard movie={movie} />
             </motion.div>
          ))}
        </div>

        {movies.length === 0 && (
          <div className="py-20 text-center">
             <Film className="w-16 h-16 text-text-main/5 mx-auto mb-4" />
             <p className="text-text-main/20 font-bold uppercase tracking-widest">No movies found in this genre on ADNFLIX</p>
          </div>
        )}
      </div>
    </div>
  );
}

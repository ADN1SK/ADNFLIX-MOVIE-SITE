/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Movie } from "@/src/types";
import MovieCard from "@/src/components/movies/MovieCard";
import { Search as SearchIcon } from "lucide-react";
import { motion } from "motion/react";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/movies/search/movie?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setMovies(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearchResults();
    window.scrollTo(0, 0);
  }, [query]);

  if (loading && query) return (
    <div className="h-screen w-full flex items-center justify-center bg-bg-main pt-20">
       <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <SearchIcon className="w-6 h-6 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight uppercase">Search Results</h1>
            </div>
            <p className="text-text-main/40 uppercase tracking-widest text-[10px] font-bold">
              Searching for "{query}" on ADNFLIX
            </p>
        </header>

        {movies.length > 0 ? (
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
        ) : (
          <div className="py-20 text-center">
             <SearchIcon className="w-16 h-16 text-text-main/5 mx-auto mb-4" />
             <p className="text-text-main/20 font-bold uppercase tracking-widest">No results found for "{query}" on ADNFLIX</p>
             <p className="mt-2 text-text-main/10 text-xs">Try searching for famous titles or actors</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Star, Search as SearchIcon } from "lucide-react";
import { Movie } from "@/src/types";
import { TMDB_CONFIG } from "@/src/constants";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";

interface SearchResultsProps {
  results: Movie[];
  isLoading: boolean;
  onSelect: () => void;
  query: string;
  selectedIndex: number;
}

export default function SearchResults({
  results,
  isLoading,
  onSelect,
  query,
  selectedIndex,
}: SearchResultsProps) {
  const navigate = useNavigate();
  if (!query) return null;

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
    onSelect();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      className="absolute top-full left-0 right-0 mt-2 bg-card-bg/95 backdrop-blur-xl border border-text-main/10 rounded-2xl shadow-skeuo-lg overflow-hidden z-50 max-h-[70vh] flex flex-col"
    >
      <div className="p-4 border-b border-text-main/5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          Searching ADNFLIX
        </span>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        )}
      </div>

      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {results.length > 0 ? (
          <div className="p-2 space-y-1">
            {results.map((movie, idx) => (
              <Link
                key={movie.id}
                to={`/movies/${movie.id}`}
                onClick={onSelect}
                className={cn(
                  "flex items-center gap-4 p-2 rounded-xl transition-all group cursor-pointer",
                  selectedIndex === idx
                    ? "bg-primary/20 border-primary/20"
                    : "hover:bg-primary/5",
                )}
              >
                <div className="w-12 h-18 bg-bg-main rounded-lg overflow-hidden flex-shrink-0 shadow-skeuo-sm border border-text-main/5">
                  {movie.poster_path ? (
                    <img
                      src={`${TMDB_CONFIG.IMG_BASE_URL}/w92${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-main/20">
                      <SearchIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate text-text-main group-hover:text-primary transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-main/40 font-mono">
                      {movie.release_date?.split("-")[0] || "N/A"}
                    </span>
                    <div className="flex items-center gap-0.5 text-gold text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {movie.vote_average.toFixed(1)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="p-12 text-center">
            <SearchIcon className="w-12 h-12 text-text-main/10 mx-auto mb-4" />
            <p className="text-text-main/40 text-sm">
              No results found on ADNFLIX
            </p>
            <p className="text-[10px] text-text-main/20 mt-1 uppercase tracking-tighter italic">
              Try checking your spelling
            </p>
          </div>
        ) : null}
      </div>

      <div className="p-3 bg-bg-main/50 border-t border-text-main/5 text-center cursor-default">
        <button
          onClick={handleViewAll}
          className="text-[10px] font-bold text-text-main/30 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
        >
          View All Results
        </button>
      </div>
    </motion.div>
  );
}

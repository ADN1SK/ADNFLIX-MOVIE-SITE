/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Film } from "lucide-react";
import { Cast } from "@/src/types";
import { TMDB_CONFIG } from "@/src/constants";

interface CastOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  cast: Cast[];
  movieTitle: string;
  onPersonClick: (id: number) => void;
}

export default function CastOverlay({
  isOpen,
  onClose,
  cast,
  movieTitle,
  onPersonClick,
}: CastOverlayProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] bg-bg-main flex flex-col overflow-hidden"
        >
          <header className="px-6 py-8 md:px-12 flex items-center justify-between border-b border-white/5 bg-card-bg/50 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Film className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight uppercase">
                  Full Cast & Crew
                </h1>
              </div>
              <p className="text-text-main/40 uppercase tracking-widest text-[10px] font-bold">
                ADNFLIX Index for{" "}
                <span className="text-primary">{movieTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-card-bg border border-white/10 hover:border-primary/50 text-text-main transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
            <div className="max-w-screen-2xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                {cast.map((person, idx) => (
                  <motion.div
                    key={`${person.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => onPersonClick(person.id)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 skeuo-card border-none shadow-sm group-hover:shadow-skeuo-md group-hover:scale-[1.02] transition-all">
                      {person.profile_path ? (
                        <img
                          src={`${TMDB_CONFIG.IMG_BASE_URL}/w342${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-card-bg flex items-center justify-center text-text-main/10">
                          <User className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">
                      {person.name}
                    </h3>
                    <p className="text-xs text-text-main/40 font-medium">
                      {person.character}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

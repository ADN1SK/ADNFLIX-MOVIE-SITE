/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  Film,
  Star,
  User,
  Twitter,
  Instagram,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TMDB_CONFIG } from "@/src/constants";
import { useNavigate } from "react-router-dom";
import MovieCard from "./MovieCard";

interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
}

interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  character?: string;
  poster_path: string | null;
  vote_average: number;
  media_type: "movie" | "tv";
  popularity: number;
}

interface ExternalIds {
  twitter_id: string | null;
  instagram_id: string | null;
}

interface PersonModalProps {
  personId: number | null;
  onClose: () => void;
}

const calculateAge = (birthday: string | null) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function PersonModal({ personId, onClose }: PersonModalProps) {
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [credits, setCredits] = useState<PersonCredit[]>([]);
  const [externalIds, setExternalIds] = useState<ExternalIds | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (personId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [personId]);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      setCredits([]);
      setExternalIds(null);
      return;
    }

    const fetchPersonData = async () => {
      setLoading(true);
      try {
        const [detailRes, creditsRes, externalRes] = await Promise.all([
          fetch(`/api/movies/person/${personId}`),
          fetch(`/api/movies/person/${personId}/combined_credits`),
          fetch(`/api/movies/person/${personId}/external_ids`),
        ]);

        const detailData = await detailRes.json();
        const creditsData = await creditsRes.json();
        const externalData = await externalRes.json();

        setPerson(detailData);
        setExternalIds(externalData);
        const sortedCredits = (creditsData.cast || [])
          .filter((credit: PersonCredit) => credit.character) // Ensure it's an acting role
          .sort((a: PersonCredit, b: PersonCredit) => {
            // Sort primarily by release date (most recent first)
            const dateA = new Date(
              a.release_date || a.first_air_date || "1900-01-01",
            ).getTime();
            const dateB = new Date(
              b.release_date || b.first_air_date || "1900-01-01",
            ).getTime();
            if (dateA !== dateB) {
              return dateB - dateA;
            }
            // Secondary sort by popularity if dates are the same
            return b.popularity - a.popularity;
          })
          .slice(0, 12);
        setCredits(sortedCredits);
      } catch (err) {
        console.error("Error fetching person details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonData();
  }, [personId]);

  return (
    <AnimatePresence>
      {personId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-main/90 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-card-bg rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-card-bg/50 text-text-main hover:bg-primary hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {loading ? (
              <div className="w-full h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : person ? (
              <>
                <div className="w-full md:w-80 shrink-0 bg-bg-main/50 border-r border-white/5 p-6 flex flex-col items-center text-center overflow-y-auto">
                  <div className="w-48 h-64 rounded-2xl overflow-hidden skeuo-card border-none mb-6 shrink-0 shadow-lg">
                    {person.profile_path ? (
                      <img
                        src={`${TMDB_CONFIG.IMG_BASE_URL}/w500${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-card-bg flex items-center justify-center text-text-main/20">
                        <User className="w-20 h-20" />
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {externalIds &&
                    (externalIds.twitter_id || externalIds.instagram_id) && (
                      <div className="flex gap-4 mb-6">
                        {externalIds.instagram_id && (
                          <a
                            href={`https://instagram.com/${externalIds.instagram_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-card-bg border border-white/5 hover:border-primary/50 text-text-main/60 hover:text-primary transition-all"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {externalIds.twitter_id && (
                          <a
                            href={`https://twitter.com/${externalIds.twitter_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-card-bg border border-white/5 hover:border-primary/50 text-text-main/60 hover:text-primary transition-all"
                          >
                            <Twitter className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    )}

                  <h2 className="text-2xl font-bold mb-4">{person.name}</h2>
                  <div className="space-y-3 w-full text-sm">
                    {person.birthday && (
                      <div className="flex items-center gap-3 bg-card-bg/50 p-3 rounded-xl border border-white/5 text-left">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase font-bold text-text-main/30">
                            Born
                          </p>
                          <p className="text-text-main/80 font-medium">
                            {person.birthday} ({calculateAge(person.birthday)}{" "}
                            years old)
                          </p>
                        </div>
                      </div>
                    )}
                    {person.place_of_birth && (
                      <div className="flex items-center gap-3 bg-card-bg/50 p-3 rounded-xl border border-white/5 text-left">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase font-bold text-text-main/30">
                            Birthplace
                          </p>
                          <p className="text-text-main/80 font-medium line-clamp-1">
                            {person.place_of_birth}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                  <section className="mb-10">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-3">
                      Biography
                    </h3>
                    <p className="text-text-main/70 leading-relaxed text-sm whitespace-pre-line">
                      {person.biography || "No biography available."}
                    </p>
                  </section>
                  <section>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-6">
                      Notable Credits
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {credits.map((credit) => (
                        <MovieCard
                          key={`${credit.media_type}-${credit.id}`}
                          movie={credit as any}
                          onClick={() => {
                            if (
                              !window.location.pathname.startsWith("/person/")
                            ) {
                              onClose();
                            }
                          }}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bookmark,
  ChevronRight,
  Clock,
  Heart,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  decodeJwtPayload,
  getAuthToken,
  getCurrentUserId,
} from "@/src/lib/authSession";
import MovieCard from "../movies/MovieCard";
import type { Movie } from "@/src/types";
import OverviewDashboard from "./OverviewDashboard";
import AvatarSelectionModal from "./AvatarSelectionModal";
import DeleteButton from "./DeleteButton";

const accountTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "watchlist", label: "Watchlist", icon: Bookmark },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "history", label: "History", icon: Clock },
];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Cinema Enthusiast");
  const activeTab = searchParams.get("tab") || "overview";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  type SavedListItem = {
    tmdb_movie_id: number;
    movie_title: string;
    type: "watchlist" | "favorite";
  };

  type ReviewItem = {
    id: number;
    user_id: number;
    tmdb_movie_id: number;
    movie_title: string;
    rating: number;
    review_text: string;
    created_at: string;
  };

  type HistoryItem = Movie & {
    history_id: number;
    media_type?: string;
    watched_at?: string;
  };

  // Data States
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadData = useCallback(async () => {
    const token = getAuthToken();
    const userId = getCurrentUserId();

    if (!token) {
      setWatchlist([]);
      setFavorites([]);
      setReviews([]);
      setHistory([]);
    } else {
      try {
        const profileRes = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setAvatarUrl(profile.avatar_url);
          setUserName(profile.name || "Cinema Enthusiast");
        }

        const endpoints = [
          { type: "watchlist", url: "/api/user-movies/watchlist" },
          { type: "favorite", url: "/api/user-movies/favorite" },
          { type: "reviews", url: `/api/reviews/${userId}` },
          { type: "history", url: "/api/history" },
        ];

        const results = await Promise.all(
          endpoints.map(async (endpoint) => {
            const res = await fetch(endpoint.url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              // History might be empty if no movies watched yet
              if (endpoint.type === "history" && res.status === 404) return { type: "history", data: [] };
              throw new Error(`Failed to load ${endpoint.type}`);
            }
            const data = await res.json();
            return { type: endpoint.type, data };
          }),
        );

        const watchlistData: SavedListItem[] =
          results.find((r) => r.type === "watchlist")?.data || [];
        const favoritesData: SavedListItem[] =
          results.find((r) => r.type === "favorite")?.data || [];
        const reviewsData: ReviewItem[] =
          results.find((r) => r.type === "reviews")?.data || [];
        const historyData: any[] =
          results.find((r) => r.type === "history")?.data || [];

        const fetchFullMovie = async (item: SavedListItem | any): Promise<Movie> => {
          const tmdbId = item.tmdb_movie_id;
          const res = await fetch(`/api/movies/movie/${tmdbId}`);
          if (!res.ok) throw new Error(`Failed to load movie ${tmdbId}`);
          return res.json();
        };

        const [fullWatchlist, fullFavorites] = await Promise.all([
          Promise.all(watchlistData.map(fetchFullMovie)),
          Promise.all(favoritesData.map(fetchFullMovie)),
        ]);

        const fullHistory: HistoryItem[] = await Promise.all(
          historyData.map(async (item) => {
            const movie = await fetchFullMovie(item);
            return {
              ...movie,
              history_id: item.id,
              media_type: item.media_type,
              watched_at: item.watched_at,
            };
          })
        );

        setWatchlist(fullWatchlist);
        setFavorites(fullFavorites);
        setReviews(reviewsData);
        setHistory(fullHistory);
      } catch (err) {
        console.error("Failed to load persistent data:", err);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener("adnflix_sync", loadData);
    return () => window.removeEventListener("adnflix_sync", loadData);
  }, [loadData]);

  const activeLabel =
    accountTabs.find((item) => item.id === activeTab)?.label || "Overview";

  const accountStats = useMemo(
    () => [
      { label: "Watchlist", value: watchlist.length.toString() },
      { label: "Reviews", value: reviews.length.toString() },
      { label: "History", value: history.length.toString() },
    ],
    [watchlist, reviews, history],
  );

  const clearHistory = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new Event("adnflix_sync"));
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "History cleared successfully" },
        }),
      );
    } catch (err) {
      console.error("Failed to clear history", err);
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "Error clearing history" },
        }),
      );
    }
  };

  const handleDeleteHistoryItem = async (historyId: number) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/history/${historyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        window.dispatchEvent(new Event("adnflix_sync"));
        window.dispatchEvent(
          new CustomEvent("adnflix_toast", {
            detail: { message: "Removed from history" },
          }),
        );
      }
    } catch (err) {
      console.error("Failed to delete history item", err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/reviews/manage/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        window.dispatchEvent(new Event("adnflix_sync"));
        window.dispatchEvent(
          new CustomEvent("adnflix_toast", {
            detail: { message: "Review deleted successfully" },
          }),
        );
      } else {
        throw new Error("Failed to delete review");
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "Error deleting review" },
        }),
      );
    }
  };

  const renderGrid = (items: Movie[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item, index) => (
        <MovieCard key={`${item.id}-${index}`} movie={item} />
      ))}
    </div>
  );

  const currentContent = useMemo(() => {
    if (activeTab === "watchlist") return watchlist;
    if (activeTab === "favorites") return favorites;
    if (activeTab === "history") return history;
    return [];
  }, [activeTab, watchlist, favorites, history]);

  return (
    <div className="min-h-screen bg-bg-main px-4 pt-28 pb-16 md:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <header className="mb-8 overflow-hidden rounded-2xl border border-text-main/10 bg-card-bg/60 p-6 shadow-skeuo-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative h-24 w-24 shrink-0 rounded-2xl border border-primary/20 bg-bg-main shadow-skeuo-inner">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary/5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    <User className="h-10 w-10 text-primary/70" />
                  )}
                </div>
                <button 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute -bottom-2 -right-2 rounded-xl bg-primary p-2 text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {userName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    ADNFLIX Member
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-text-main/55">
                  Exploring the cinematic DNA of the world, one frame at a time.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:min-w-80">
                {accountStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-text-main/10 bg-bg-main/60 p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-text-main/35">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <AvatarSelectionModal 
          isOpen={isAvatarModalOpen} 
          onClose={() => setIsAvatarModalOpen(false)}
          onUpdate={(url) => setAvatarUrl(url)}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-text-main/10 bg-card-bg/40 p-2">
            {accountTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20 cursor-default"
                      : "text-text-main/45 hover:bg-text-main/5 hover:text-text-main cursor-pointer",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </button>
              );
            })}
          </aside>

          <main className="rounded-2xl border border-text-main/10 bg-card-bg/40 p-6 md:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  My Account
                </p>
                <div className="flex items-center gap-4">
                  <h2 className="mt-1 text-2xl font-bold">{activeLabel}</h2>
                  {activeTab === "history" && history.length > 0 && (
                    <DeleteButton
                      onDelete={clearHistory}
                      label="Clear History"
                      className="mt-1"
                      confirmMessage="Wipe all history?"
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/trending"
                  className="rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-white cursor-pointer"
                >
                  Trending
                </Link>
              </div>
            </div>

            {activeTab === "overview" ? (
              <OverviewDashboard 
                userName={userName}
                history={history} 
                watchlist={watchlist} 
                favorites={favorites} 
                reviews={reviews} 
              />
            ) : activeTab === "reviews" ? (
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev: ReviewItem) => (
                    <div
                      key={rev.id}
                      className="flex flex-col gap-4 p-6 rounded-2xl bg-bg-main/40 border border-text-main/10 shadow-skeuo-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-xl text-text-main">
                            {rev.movie_title}
                          </h4>
                          <p className="text-[10px] font-bold uppercase text-text-main/40 tracking-widest mt-1">
                            {new Date(rev.created_at).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-3 h-3",
                                star <= rev.rating
                                  ? "fill-primary text-primary"
                                  : "text-text-main/20",
                              )}
                            />
                          ))}
                          <span className="ml-1.5 text-xs font-bold text-primary">
                            {rev.rating}.0
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-2 -top-2 text-4xl text-primary/10 font-serif">
                          "
                        </span>
                        <p className="text-sm text-text-main/70 italic leading-relaxed pl-4">
                          {rev.review_text}
                        </p>
                      </div>
                      <div className="flex justify-end gap-3 mt-2">
                        <DeleteButton
                          onDelete={() => handleDeleteReview(rev.id)}
                          label="Delete Review"
                          confirmMessage="Remove this review?"
                        />
                        <Link
                          to={`/movies/${rev.tmdb_movie_id}`}
                          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                        >
                          View Movie
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-text-main/20 italic">
                    No reviews written yet.
                  </div>
                )}
              </div>
            ) : activeTab === "history" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                {history.map((item, index) => (
                  <div key={`${item.history_id}-${index}`} className="relative group/h">
                    <MovieCard movie={item} />
                    <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/h:opacity-100 transition-opacity">
                       <DeleteButton 
                          onDelete={() => handleDeleteHistoryItem(item.history_id)}
                          label=""
                          confirmMessage="Remove?"
                          className="bg-bg-main/80 backdrop-blur-md rounded-full p-1 border border-white/10"
                       />
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="col-span-full py-20 text-center text-text-main/20 italic">
                    No viewing history yet.
                  </div>
                )}
              </div>
            ) : currentContent.length > 0 ? (
              renderGrid(currentContent)
            ) : (
              <div className="flex min-h-95 flex-col items-center justify-center rounded-2xl border border-dashed border-text-main/10 bg-bg-main/40 p-8 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bookmark className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-bold">
                  No {activeLabel.toLowerCase()} yet
                </h3>
                <p className="mb-7 max-w-sm text-sm leading-6 text-text-main/45">
                  Start exploring ADNFLIX to build your profile and keep track
                  of the movies that match your taste.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/trending"
                    className="rounded-full bg-primary px-7 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 cursor-pointer"
                  >
                    Browse Trending
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

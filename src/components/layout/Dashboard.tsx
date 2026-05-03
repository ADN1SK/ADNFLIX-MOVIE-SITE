/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Tv,
  Bookmark,
  Trash2,
  ChevronRight,
  Clock,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import MovieCard from "../movies/MovieCard";

const accountTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "watchlist", label: "Watchlist", icon: Bookmark },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "history", label: "History", icon: Clock },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Data States
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [history, setHistory] = useState([]);

  const loadData = () => {
    setWatchlist(JSON.parse(localStorage.getItem("adnflix_watchlist") || "[]"));
    setFavorites(JSON.parse(localStorage.getItem("adnflix_favorites") || "[]"));
    setReviews(JSON.parse(localStorage.getItem("adnflix_reviews") || "[]"));
    setHistory(JSON.parse(localStorage.getItem("adnflix_history") || "[]"));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("adnflix_sync", loadData);
    return () => window.removeEventListener("adnflix_sync", loadData);
  }, []);

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

  const clearHistory = () => {
    localStorage.removeItem("adnflix_history");
    window.dispatchEvent(new Event("adnflix_sync"));
  };

  const renderGrid = (items: any[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <MovieCard key={item.id} movie={item} />
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
                  <User className="h-10 w-10 text-primary/70" />
                </div>
                <button className="absolute -bottom-2 -right-2 rounded-xl bg-primary p-2 text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 cursor-pointer">
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Cinema Enthusiast
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
        </header>

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
                    <button
                      onClick={clearHistory}
                      className="text-[10px] uppercase font-bold text-text-main/30 hover:text-primary flex items-center gap-1 transition-colors mt-1"
                    >
                      <Trash2 className="h-3 w-3" /> Clear History
                    </button>
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
              <div className="space-y-12">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/30 mb-6">
                    Recent History
                  </h3>
                  {history.length > 0 ? (
                    renderGrid(history.slice(0, 5))
                  ) : (
                    <p className="text-sm text-text-main/20 italic">
                      No history yet.
                    </p>
                  )}
                </section>
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/30 mb-6">
                    Watchlist Preview
                  </h3>
                  {watchlist.length > 0 ? (
                    renderGrid(watchlist.slice(0, 5))
                  ) : (
                    <p className="text-sm text-text-main/20 italic">
                      Watchlist is empty.
                    </p>
                  )}
                </section>
              </div>
            ) : activeTab === "reviews" ? (
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev: any, i: number) => (
                    <div
                      key={i}
                      className="flex gap-6 p-4 rounded-2xl bg-bg-main/40 border border-text-main/5"
                    >
                      <Link
                        to={`/movies/${rev.id}?type=${rev.media_type}`}
                        className="w-20 h-28 shrink-0 rounded-lg overflow-hidden border border-text-main/10 shadow-sm"
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w185${rev.poster_path}`}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </Link>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{rev.title}</h4>
                        <p className="text-[10px] font-bold uppercase text-primary mb-3">
                          {new Date(rev.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-text-main/60 italic leading-relaxed">
                          "{rev.review}"
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-text-main/20 italic">
                    No reviews written yet.
                  </div>
                )}
              </div>
            ) : currentContent.length > 0 ? (
              renderGrid(currentContent)
            ) : (
              <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-text-main/10 bg-bg-main/40 p-8 text-center">
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

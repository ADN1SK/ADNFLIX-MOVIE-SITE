/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
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

const accountTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "watchlist", label: "Watchlist", icon: Bookmark },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "history", label: "History", icon: Clock },
];

const accountStats = [
  { label: "Watchlist", value: "124" },
  { label: "Reviews", value: "48" },
  { label: "Avg Rating", value: "8.4" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const activeLabel =
    accountTabs.find((item) => item.id === activeTab)?.label || "Overview";

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
                <button className="absolute -bottom-2 -right-2 rounded-xl bg-primary p-2 text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105">
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
                  Exploring the cinematic DNA of the world, one frame at a
                  time.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 md:min-w-80">
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
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-text-main/45 hover:bg-text-main/5 hover:text-text-main",
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
                <h2 className="mt-1 text-2xl font-bold">{activeLabel}</h2>
              </div>
              <Link
                to="/"
                className="rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Explore
              </Link>
            </div>

            <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-text-main/10 bg-bg-main/40 p-8 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bookmark className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-bold">
                No {activeLabel.toLowerCase()} yet
              </h3>
              <p className="mb-7 max-w-sm text-sm leading-6 text-text-main/45">
                Start exploring ADNFLIX to build your profile and keep track of
                the movies that match your taste.
              </p>
              <Link
                to="/trending"
                className="rounded-full bg-primary px-7 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105"
              >
                Browse Trending
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

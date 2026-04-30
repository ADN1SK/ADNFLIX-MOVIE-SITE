/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Bookmark, Heart, MessageSquare, Settings, ShieldCheck, ChevronRight, History } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="pt-24 min-h-screen bg-bg-main px-4 md:px-8 pb-12">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Profile Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8 skeuo-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <span className="text-9xl font-bold tracking-tighter">DNA</span>
            </div>

            <div className="relative group">
               <div className="w-32 h-32 rounded-full bg-bg-main shadow-skeuo-lg border-2 border-primary/20 flex items-center justify-center p-1 group-hover:border-primary/50 transition-all overflow-hidden">
                  <div className="w-full h-full rounded-full bg-card-bg flex items-center justify-center">
                    <User className="w-12 h-12 text-text-main/20" />
                  </div>
               </div>
               <button className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-white shadow-lg hover:scale-110 transition-transform">
                  <Settings className="w-4 h-4" />
               </button>
            </div>

            <div className="flex-1 text-center md:text-left">
               <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                 <h1 className="text-3xl font-bold">Cinema Enthusiast</h1>
                 <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(229,9,20,0.2)]">
                   <ShieldCheck className="w-3 h-3" />
                   ADNFLIX Member
                 </div>
               </div>
               <p className="text-text-main/60 max-w-xl mb-4">"Exploring the cinematic DNA of the world, one frame at a time."</p>
               <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5"><span className="text-primary font-bold">124</span> <span className="text-text-main/40">Watchlist</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-primary font-bold">48</span> <span className="text-text-main/40">Reviews</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-primary font-bold">8.4</span> <span className="text-text-main/40">Avg Rating</span></div>
               </div>
            </div>

            <div className="w-full md:w-auto">
               <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary mb-2">Subscription</span>
                  <span className="text-2xl font-serif italic text-gold mb-4">ADNFLIX Premium</span>
                  <button className="w-full px-6 py-2.5 rounded-xl bg-card-bg border border-text-main/5 text-xs font-bold hover:border-primary/50 transition-all shadow-skeuo-sm uppercase tracking-widest">
                    Manage Billing
                  </button>
               </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Nav */}
          <aside className="lg:col-span-1 space-y-2">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "watchlist", label: "My Watchlist", icon: Bookmark },
              { id: "favorites", label: "My Favorites", icon: Heart },
              { id: "reviews", label: "My Reviews", icon: MessageSquare },
              { id: "history", label: "Watch History", icon: History },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold text-sm",
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                    : "bg-card-bg/30 border border-text-main/5 text-text-main/40 hover:text-text-main hover:bg-card-bg/50"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
             <div className="skeuo-card p-12 min-h-[500px] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-pulse">
                   {/* Icon dynamic based on tab */}
                   <Bookmark className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Your {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} is Empty</h3>
                <p className="text-text-main/40 max-w-sm mb-8">Start exploring ADNFLIX to find your next favorite movie and build your cinematic profile.</p>
                <Link 
                  to="/"
                  className="px-8 py-3.5 rounded-full bg-primary text-white font-bold shadow-lg hover:scale-105 transition-transform"
                >
                  Start Exploring
                </Link>
             </div>
          </main>

        </div>
      </div>
    </div>
  );
}

function LayoutDashboard(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  );
}

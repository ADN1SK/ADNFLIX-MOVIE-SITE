/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  TrendingUp,
  Flame,
  Tags,
  User,
  LayoutDashboard,
  Bookmark,
  Heart,
  Clock,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Trending", path: "/trending", icon: TrendingUp },
  { label: "Popular Hits", path: "/popular", icon: Flame },
  { label: "Browse Genres", path: "/genres", icon: Tags },
];

const dashboardItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Watchlist", path: "/dashboard?tab=watchlist", icon: Bookmark },
  { label: "Favorites", path: "/dashboard?tab=favorites", icon: Heart },
  { label: "History", path: "/dashboard?tab=history", icon: Clock },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -320,
          width: isOpen ? 320 : 0
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-20 left-0 bottom-0 z-[110] bg-card-bg/95 backdrop-blur-xl border-r border-white/5 flex flex-col overflow-hidden",
          !isOpen && "pointer-events-none border-none"
        )}
      >
        {/* Content */}
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-8 scrollbar-hide">
          {/* Main Navigation */}
          <div className="space-y-2">
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/20">
              Menu
            </h4>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-text-main/60 hover:bg-white/5 hover:text-text-main cursor-pointer"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Dashboard Section */}
          <div className="space-y-2">
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/20">
              Personal DNA
            </h4>
            {dashboardItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === "/dashboard" && location.search.includes(item.path.split('=')[1] || "overview");
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-text-main/60 hover:bg-white/5 hover:text-text-main cursor-pointer"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="space-y-2">
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/20">
              User
            </h4>
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-main/60 hover:bg-white/5 hover:text-text-main transition-all font-bold text-sm cursor-pointer"
            >
              <User className="w-5 h-5" />
              <span>Account Settings</span>
            </Link>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-main/30 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-sm cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

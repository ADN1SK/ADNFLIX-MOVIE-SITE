/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  User,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { ADNFLIX_CONFIG } from "@/src/constants";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import SearchResults from "../search/SearchResults";
import { Movie } from "@/src/types";

import { useTheme } from "@/src/lib/ThemeContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isDashboard = location.pathname === "/dashboard";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/movies/search/movie?query=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        setResults(data.results?.slice(0, 8) || []);
        setSelectedIndex(-1);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      navigate(`/movies/${results[selectedIndex].id}`);
      setIsSearchExpanded(false);
      setSearchQuery("");
      return;
    }
    if (searchQuery.trim()) {
      setIsSearchExpanded(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Escape") {
      setIsSearchExpanded(false);
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center px-4 md:px-8",
        isScrolled ? "glass-nav shadow-lg" : "bg-transparent",
      )}
    >
      <div className="max-w-screen-2xl mx-auto w-full flex items-center gap-4 md:gap-8">
        {/* Dashboard Button */}
        <Link
          to="/dashboard"
          className={cn(
            "hidden lg:flex items-center justify-center w-10 h-10 rounded-lg transition-all shrink-0 shadow-skeuo-sm border",
            isDashboard
              ? "bg-primary/10 border-primary/30 shadow-skeuo-md"
              : "bg-card-bg border-text-main/5 hover:border-primary/30 hover:shadow-skeuo-md",
          )}
        >
          <LayoutDashboard
            className={cn(
              "w-5 h-5 transition-colors",
              isDashboard ? "text-primary" : "text-text-main/40",
            )}
          />
        </Link>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-primary/40 rounded-full"
            />
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(229,9,20,0.5)]">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white ml-0.5" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-tighter hidden sm:block text-text-main">
            ADN<span className="text-primary italic">FLIX</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center max-w-2xl mx-auto relative">
          <form
            onSubmit={handleSearchSubmit}
            className={cn(
              "relative group transition-all duration-500 flex items-center w-full",
              isSearchExpanded ? "scale-105" : "",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-full border transition-all duration-300",
                "bg-card-bg/50 border-text-main/10 shadow-sm",
                isSearchExpanded
                  ? "shadow-skeuo-inner border-primary/40"
                  : "group-hover:border-text-main/20",
              )}
            />
            <Search className="absolute left-4 w-4 h-4 text-text-main/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ADNFLIX..."
              className={cn(
                "w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 pl-12 pr-10 transition-opacity",
                "text-text-main placeholder:text-text-main/30",
                !isSearchExpanded && "hidden md:block",
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchExpanded(true)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 p-1 text-text-main/30 hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <AnimatePresence>
            {isSearchExpanded && (
              <>
                <div
                  className="fixed inset-0 bg-bg-main/40 backdrop-blur-sm -z-10"
                  onClick={() => setIsSearchExpanded(false)}
                />
                <SearchResults
                  query={searchQuery}
                  results={results}
                  isLoading={isLoading}
                  selectedIndex={selectedIndex}
                  onSelect={() => {
                    setIsSearchExpanded(false);
                    setSearchQuery("");
                  }}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex p-2 rounded-full hover:bg-black/5 transition-colors text-text-main/80"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-gold" />
            ) : (
              <Moon className="w-5 h-5 text-primary" />
            )}
          </button>

          <div className="h-8 w-[1px] bg-text-main/10 hidden md:block mx-1" />

          <Link to="/login" className="flex items-center gap-2 group">
            <div
              className={cn(
                "w-10 h-10 rounded-full border flex items-center justify-center group-hover:border-primary/50 transition-colors shadow-skeuo-sm overflow-hidden",
                "bg-card-bg border-text-main/10",
              )}
            >
              <User className={cn("w-5 h-5", "text-text-main")} />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}

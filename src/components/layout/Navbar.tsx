/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Home,
  TrendingUp,
  Flame,
  Tags,
  LogIn,
  User,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isDashboard = location.pathname === "/dashboard";
  const dashboardMenuItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Trending", path: "/trending", icon: TrendingUp },
    { label: "Popular", path: "/popular", icon: Flame },
    { label: "Genres", path: "/genres", icon: Tags },
    { label: "My Account", path: "/dashboard", icon: User },
    { label: "Sign In", path: "/login", icon: LogIn },
  ];
  const isEditableTarget = (target: EventTarget | null) =>
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Effect to focus the search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Start search from the keyboard when the user is not already typing elsewhere.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        setIsSearchExpanded(true);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/movies/search/movie?query=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(data.results?.slice(0, 8) || []);
        setSelectedIndex(-1);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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
    if (e.key === "Escape") {
      setIsSearchExpanded(false);
      return;
    }

    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center px-4 md:px-8",
        isScrolled ? "glass-nav shadow-lg" : "bg-transparent",
      )}
    >
      <div className="max-w-screen-2xl mx-auto w-full flex items-center gap-4 md:gap-5">
        {/* Dashboard Menu */}
        <div className="relative hidden lg:block w-10 h-10 shrink-0">
          <button
            type="button"
            onClick={() => setIsDashboardMenuOpen((isOpen) => !isOpen)}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-all shadow-skeuo-sm border",
              isDashboard || isDashboardMenuOpen
                ? "bg-primary/10 border-primary/30 shadow-skeuo-md"
                : "bg-card-bg border-text-main/5 hover:border-primary/30 hover:shadow-skeuo-md",
            )}
          >
            <LayoutDashboard
              className={cn(
                "w-5 h-5 transition-colors",
                isDashboard || isDashboardMenuOpen
                  ? "text-primary"
                  : "text-text-main/40",
              )}
            />
          </button>

          <AnimatePresence>
            {isDashboardMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDashboardMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute left-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-text-main/10 bg-card-bg/95 p-2 shadow-skeuo-lg backdrop-blur-xl"
                >
                  {dashboardMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setIsDashboardMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-text-main/70 transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={cn("md:hidden p-2", isSearchExpanded && "hidden")}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6 text-text-main" />
        </button>

        {/* Logo */}
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 group shrink-0",
            isSearchExpanded && "hidden sm:flex",
          )}
        >
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
        <div
          className={cn(
            "flex-1 flex justify-center max-w-2xl mx-auto relative transition-all duration-300",
            isSearchExpanded ? "z-50" : "z-10",
          )}
        >
          <form
            onSubmit={handleSearchSubmit}
            onClick={() => {
              setIsSearchExpanded(true);
              searchInputRef.current?.focus();
            }}
            className={cn(
              "relative group transition-all duration-500 flex items-center w-full",
              isSearchExpanded ? "md:scale-105" : "",
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
                "w-full bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 text-sm py-2.5 pl-12 pr-36 transition-opacity",
                "text-text-main placeholder:text-text-main/30",
                !isSearchExpanded && "opacity-0 md:opacity-100",
              )}
              value={searchQuery}
              ref={searchInputRef}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsSearchExpanded(true);
                searchInputRef.current?.focus();
              }}
              onKeyDown={handleKeyDown}
            />
            {!isSearchExpanded && !searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setIsSearchExpanded(true);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-text-main/35 outline-none hover:text-primary focus:outline-none focus-visible:outline-none transition-colors"
              >
                <span>Click</span>
                <kbd className="min-w-5 rounded-md border border-text-main/10 bg-bg-main/50 px-1.5 py-0.5 font-mono text-[10px] text-text-main/50">
                  /
                </kbd>
                <span>to search</span>
              </button>
            )}
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
                <div className="absolute top-full left-0 right-0 mt-2 w-full">
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
                </div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-bg-main/95 backdrop-blur-md z-[60] md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-[80%] bg-card-bg shadow-2xl z-[70] md:hidden p-8 flex flex-col"
              >
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="self-end p-2 mb-8"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex flex-col gap-6">
                  {[
                    { label: "Home", path: "/" },
                    { label: "Dashboard", path: "/dashboard" },
                    { label: "Search", path: "/search" },
                    { label: "About", path: "/about" },
                    { label: "Contact", path: "/contact" },
                    { label: "Login", path: "/login" },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "text-xl font-bold tracking-widest uppercase py-2 border-b border-text-main/5",
                        location.pathname === item.path
                          ? "text-primary"
                          : "text-text-main/60",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-3",
            isSearchExpanded && "hidden md:flex",
          )}
        >
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

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
  Settings,
  LogOut,
  Sliders,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { getAuthToken, clearUserSession } from "@/src/lib/authSession";
import SearchResults from "../search/SearchResults";
import { Movie } from "@/src/types";

import { useTheme } from "@/src/lib/ThemeContext";

import PreferencesModal from "./PreferencesModal";

export default function Navbar({ 
  onToggleSidebar, 
  isSidebarOpen 
}: { 
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const settingsRef = React.useRef<HTMLDivElement>(null);
  const token = getAuthToken();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearUserSession();
    setIsSettingsOpen(false);
    navigate("/");
    window.dispatchEvent(
      new CustomEvent("adnflix_toast", {
        detail: {
          message: "You have successfully signed out.",
          movieTitle: "Goodbye!",
        },
      }),
    );
  };
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Logic for logo speed boost and sound effect
  const [logoDuration, setLogoDuration] = useState(20);
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    // Skip the speed boost on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Temporarily increase logo spin speed (lower duration = faster spin)
    setLogoDuration(0.6);
    const timer = setTimeout(() => setLogoDuration(20), 1200);
    return () => clearTimeout(timer);
  }, [theme]);

  const handleToggleTheme = () => {
    toggleTheme();

    // Play a subtle switch sound
    // Note: Use a local asset like '/sounds/toggle.mp3' in production
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
    );
    audio.volume = 0.2;
    audio.play().catch(() => {}); // Browsers may block audio until first user interaction
  };

  const isDashboard = location.pathname === "/dashboard";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  if (isAuthPage) return null;
  
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
        "fixed top-0 left-0 right-0 z-[120] transition-all duration-500 ease-in-out h-20 flex items-center px-4 md:px-8",
        isScrolled ? "glass-nav shadow-lg" : "bg-transparent",
      )}
    >
      <div className="max-w-screen-2xl mx-auto w-full flex items-center gap-4 md:gap-5">
        {/* Sidebar Toggle */}
        <div className={cn("flex items-center", isSearchExpanded && "hidden md:flex")}>
          <button
            type="button"
            onClick={onToggleSidebar}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-all shadow-skeuo-sm border",
              isSidebarOpen
                ? "bg-primary/10 border-primary/30 shadow-skeuo-md cursor-pointer"
                : "bg-card-bg border-text-main/5 hover:border-primary/30 hover:shadow-skeuo-md cursor-pointer",
            )}
          >
            <LayoutDashboard
              className={cn(
                "w-5 h-5 transition-colors",
                isSidebarOpen ? "text-primary" : "text-text-main/40",
              )}
            />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={cn(
            "md:hidden p-2 cursor-pointer",
            isSearchExpanded && "hidden",
          )}
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
              transition={{
                duration: logoDuration,
                repeat: Infinity,
                ease: "linear",
              }}
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
              isSearchExpanded ? "md:scale-105 cursor-text" : "cursor-pointer",
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
            <Search className="absolute left-4 w-4 h-4 text-text-main/50 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search ADNFLIX..."
              className={cn(
                "w-full bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 text-sm py-2.5 pl-12 pr-36 transition-opacity",
                "text-text-main placeholder:text-text-main/30 cursor-text",
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
                className="absolute right-3 hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-text-main/35 outline-none hover:text-primary focus:outline-none focus-visible:outline-none transition-colors cursor-pointer"
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
                className="absolute right-4 p-1 text-text-main/30 hover:text-primary transition-colors cursor-pointer z-10"
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
                  className="self-end p-2 mb-8 cursor-pointer"
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
                          : "text-text-main/60 cursor-pointer",
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
          <motion.button
            whileTap={{ scale: 0.9, rotate: 15 }}
            onClick={handleToggleTheme}
            className="flex p-2 rounded-full hover:bg-black/5 transition-colors text-text-main/80 cursor-pointer overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "circOut" }}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-gold" />
                ) : (
                  <Moon className="w-5 h-5 text-primary" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <div className="h-8 w-[1px] bg-text-main/10 hidden md:block mx-1" />

          {token ? (
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={cn(
                  "w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-skeuo-sm overflow-hidden group cursor-pointer",
                  isSettingsOpen ? "border-primary shadow-skeuo-md" : "border-text-main/10 bg-card-bg hover:border-primary/50"
                )}
              >
                <User className={cn("w-5 h-5 transition-colors", isSettingsOpen ? "text-primary" : "text-text-main")} />
              </button>
              
              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "circOut" }}
                    className={cn(
                      "absolute right-0 mt-3 w-56 py-2 rounded-2xl border shadow-2xl backdrop-blur-3xl z-[200]",
                      theme === "dark" ? "bg-card-bg/95 border-white/10" : "bg-white/95 border-black/10"
                    )}
                  >
                    <div className="px-4 py-2 border-b border-text-main/10 mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40">Account</p>
                    </div>
                    <div className="px-2 space-y-1">
                      <Link
                        to="/dashboard?tab=overview"
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left hover:bg-primary/10 text-text-main/70 hover:text-primary group"
                      >
                        <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                        <span className="text-sm font-bold tracking-tight">User Settings</span>
                      </Link>
                      <div className="my-1 border-t border-text-main/5" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full border flex items-center justify-center group-hover:border-primary/50 transition-colors shadow-skeuo-sm overflow-hidden",
                  "bg-card-bg border-text-main/10",
                )}
              >
                <User className={cn("w-5 h-5", "text-text-main")} />
              </div>
            </Link>
          )}
        </div>
      </div>
      
      <PreferencesModal 
        isOpen={isPreferencesOpen} 
        onClose={() => setIsPreferencesOpen(false)} 
      />
    </nav>
  );
}

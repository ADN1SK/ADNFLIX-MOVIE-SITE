/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link as RouterLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { cn } from "./lib/utils";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "./components/layout/Navbar";
import LayoutFooter from "./components/layout/LayoutFooter";
import Sidebar from "./components/layout/Sidebar";
import { useEffect, useState, useRef, useCallback } from "react";
import { Movie } from "./types";
import Hero from "./components/movies/Hero";
import MovieCard from "./components/movies/MovieCard";
import {
  ChevronRight,
  ChevronLeft,
  Film,
  Globe,
  Sparkles,
  ArrowUp,
  Mail,
  Twitter,
  Instagram,
  Youtube,
  Github,
  ArrowRight
} from "lucide-react";
import MovieDetail from "./components/movies/MovieDetail";
import Dashboard from "./components/layout/Dashboard";
import GenrePage from "./components/movies/GenrePage";
import PersonPage from "./components/movies/PersonPage";
import CastPage from "./components/movies/CastPage";
import SearchPage from "./components/movies/SearchPage";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import WelcomeMessage from "./components/layout/WelcomeMessage";
import { ThemeProvider } from "./lib/ThemeContext";
import { TMDB_CONFIG, GENRES, LANGUAGES } from "./constants";
import { useTheme } from "./lib/ThemeContext";
import CustomDropdown from "./components/layout/CustomDropdown";

const MOVIE_FEEDS = {
  trending: {
    title: "Trending",
    subtitle: "What ADNFLIX viewers are watching right now",
    movieEndpoint: "trending/movie/week",
    tvEndpoint: "trending/tv/week",
  },
  popular: {
    title: "Popular Hits",
    subtitle: "Highest rated masterpieces based on user scores",
    movieEndpoint: "movie/top_rated",
    tvEndpoint: "tv/top_rated",
  },
  anime: {
    title: "Popular Anime",
    subtitle: "The most popular animation hits on ADNFLIX",
    movieEndpoint: "discover/movie?with_genres=16",
    tvEndpoint: "discover/tv?with_genres=16",
  },
  korean: {
    title: "K-Drama & Cinema",
    subtitle: "Experience the wave of Korean storytelling",
    movieEndpoint: "discover/movie?with_original_language=ko",
    tvEndpoint: "discover/tv?with_original_language=ko",
  },
};

// Mock/Fetch function placeholder
const fetchMovies = async (endpoint: string) => {
  const res = await fetch(`/api/movies/${endpoint}`);
  return res.json();
};

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function Home() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [discover, setDiscover] = useState<Movie[]>([]);
  const [recommendationReason, setRecommendationReason] = useState<string>("");
  const [popularAnime, setPopularAnime] = useState<Movie[]>([]); // New state for popular anime
  const [popularKoreans, setPopularKoreans] = useState<Movie[]>([]); // New state for popular koreans
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverGenres, setDiscoverGenres] = useState([GENRES[0], GENRES[1]]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const trendingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserName(localStorage.getItem("adnflix_user_name"));
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (trendingRef.current) {
      const { scrollLeft, clientWidth } = trendingRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo =
        direction === "left"
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount;
      trendingRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const getDaysOld = (dateString: string | undefined) => {
    if (!dateString) return 30; // Default to 30 days old if no date
    const diff = Date.now() - new Date(dateString).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateWeightedScore = (item: any, type: "watchlist" | "favorite") => {
    const baseWeight = type === "favorite" ? 3.0 : 1.0;
    const daysOld = getDaysOld(item.addedAt);
    const decayConstant = 30; // 30-day half-life
    return baseWeight * Math.pow(0.5, daysOld / decayConstant);
  };

  const refreshDiscoverGems = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsDiscovering(true);
    
    const GENRE_PAIRS = [
      [878, 16], // Sci-Fi & Animation
      [28, 35],  // Action & Comedy
      [27, 53],  // Horror & Thriller
      [10749, 35], // Romance & Comedy
      [12, 14],  // Adventure & Fantasy
      [80, 9648], // Crime & Mystery
      [28, 878], // Action & Sci-Fi
      [18, 36], // Drama & History
    ];

    const fetchDualGenreFallback = async () => {
      const pair = GENRE_PAIRS[Math.floor(Math.random() * GENRE_PAIRS.length)];
      const g1 = GENRES.find(g => g.id === pair[0]) || GENRES[0];
      const g2 = GENRES.find(g => g.id === pair[1]) || GENRES[1];
      setDiscoverGenres([g1, g2]);
      setRecommendationReason(`Recommended because you enjoy ${g1.name} and ${g2.name} movies.`);
      const endpoint = `discover/movie?with_genres=${g1.id},${g2.id}&sort_by=vote_average.desc&vote_count.gte=500`;
      return await fetchMovies(endpoint);
    };

    try {
      const token = localStorage.getItem("adnflix_token");
      if (!token) {
        // Fallback for non-logged in users: dual genres
        const data = await fetchDualGenreFallback();
        setDiscover(data.results?.slice(0, 4) || []);
        return;
      }

      const res = await fetch("http://127.0.0.1:5000/api/user/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.recommendations && data.recommendations.length > 0) {
        setDiscover(data.recommendations);
        if (data.topGenres && data.topGenres.length > 0) {
          const mainGenreId = data.topGenres[0];
          const secondGenreId = data.topGenres.length > 1 ? data.topGenres[1] : (GENRES.find(g => g.id !== mainGenreId)?.id || GENRES[1].id);
          const g1 = GENRES.find((g) => g.id === mainGenreId) || { id: mainGenreId, name: "Custom" };
          const g2 = GENRES.find((g) => g.id === secondGenreId) || { id: secondGenreId, name: "Custom" };
          setDiscoverGenres([g1, g2]);
          setRecommendationReason(`Tailored recommendations based on your unique film DNA.`);
        } else {
          setDiscoverGenres([GENRES[0], GENRES[1]]);
        }
      } else {
        // Fallback if no recommendations yet (new user)
        const fallbackData = await fetchDualGenreFallback();
        setDiscover(fallbackData.results?.slice(0, 4) || []);
      }
    } catch (err) {
      console.error("Intelligence Scan Failed:", err);
    } finally {
      if (!isInitial) {
        setTimeout(() => setIsDiscovering(false), 1500);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Initial DNA scan
        refreshDiscoverGems(true);

        const [
          trendingMovies,
          trendingTV,
          popularMoviesData,
          popularTVData,
          popularAnimeMoviesData, // Fetch popular anime movies
          popularAnimeTVData, // Fetch popular anime TV series
          popularKoreanMoviesData, // Fetch popular korean movies
          popularKoreanTVData, // Fetch popular korean TV series
        ] = await Promise.all([
          fetchMovies("trending/movie/week"),
          fetchMovies("trending/tv/week"),
          fetchMovies("movie/top_rated"),
          fetchMovies("tv/top_rated"),
          fetchMovies(MOVIE_FEEDS.anime.movieEndpoint), // Use anime movie endpoint
          fetchMovies(MOVIE_FEEDS.anime.tvEndpoint), // Use anime TV endpoint
          fetchMovies(MOVIE_FEEDS.korean.movieEndpoint), // Use korean movie endpoint
          fetchMovies(MOVIE_FEEDS.korean.tvEndpoint), // Use korean TV endpoint
        ]);

        const allTrending = [
          ...(trendingMovies.results || []).map((m: any) => ({
            ...m,
            media_type: "movie",
          })),
          ...(trendingTV.results || []).map((m: any) => ({
            ...m,
            media_type: "tv",
          })),
        ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        const combinedPopular = [
          ...(popularMoviesData.results || []).map((m: any) => ({
            ...m,
            media_type: "movie",
          })),
          ...(popularTVData.results || []).map((m: any) => ({
            ...m,
            media_type: "tv",
          })),
        ].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

        // Combine and sort popular anime movies and TV series
        const combinedPopularAnime = [
          ...(popularAnimeMoviesData.results || []).map((m: any) => ({
            ...m,
            media_type: "movie",
          })),
          ...(popularAnimeTVData.results || []).map((m: any) => ({
            ...m,
            media_type: "tv",
          })),
        ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        // Combine and sort popular korean movies and TV series
        const combinedPopularKorean = [
          ...(popularKoreanMoviesData.results || []).map((m: any) => ({
            ...m,
            media_type: "movie",
          })),
          ...(popularKoreanTVData.results || []).map((m: any) => ({
            ...m,
            media_type: "tv",
          })),
        ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        setTrending(allTrending);
        setPopular(combinedPopular);
        setPopularAnime(combinedPopularAnime); // Set the popular anime data
        setPopularKoreans(combinedPopularKorean); // Set the popular korean data
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg-main transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(229,9,20,0.3)]" />
          <span className="text-primary font-bold tracking-widest text-sm animate-pulse uppercase">
            Syncing your DNA...
          </span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {userName && <WelcomeMessage name={userName} />}
      {trending.length > 0 && <Hero movies={trending.slice(0, 10)} />}

      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 mt-6 md:mt-12 relative z-20">
        {/* Trending Section */}
        <section className="mb-16 md:mb-32">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_25px_rgba(229,9,20,0.4)]" />
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  Global <span className="text-primary">Trending</span>
                </h2>
                <p className="text-[10px] font-bold text-text-main/30 uppercase tracking-[0.3em] mt-2 ml-1">
                  What ADNFLIX is watching right now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <RouterLink
                to="/trending"
                className="hidden md:flex items-center gap-4 px-8 py-4 rounded-2xl bg-card-bg border border-text-main/10 text-text-main/60 font-black text-[10px] uppercase tracking-[0.2em] shadow-skeuo-sm hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
              >
                Full Index
                <ChevronRight className="w-4 h-4" />
              </RouterLink>
              <div className="flex gap-2">
                <button
                  onClick={() => scroll("left")}
                  className="p-3 rounded-full bg-card-bg border border-text-main/10 hover:border-primary/50 transition-all shadow-skeuo-sm active:shadow-skeuo-inner group cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-text-main/40 group-hover:text-primary" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="p-3 rounded-full bg-card-bg border border-text-main/10 hover:border-primary/50 transition-all shadow-skeuo-sm active:shadow-skeuo-inner group cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-text-main/40 group-hover:text-primary" />
                </button>
              </div>
            </div>
          </div>
          <div
            ref={trendingRef}
            className="flex overflow-x-auto gap-8 pb-12 scrollbar-hide snap-x px-1 -mx-4 md:mx-0"
          >
            {trending.slice(1, 15).map((movie) => (
              <div
                key={movie.id}
                className="min-w-[200px] sm:min-w-[240px] md:min-w-[280px] snap-start"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>

        {/* Genre Showcase */}
        <section className="mb-12 md:mb-24">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_25px_rgba(229,9,20,0.4)]" />
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  Curated Categories
                </h2>
                <p className="text-[10px] font-bold text-text-main/30 uppercase tracking-[0.3em] mt-2 ml-1">
                  Explore the ADNFLIX cinematic library
                </p>
              </div>
            </div>
            <RouterLink
              to="/genres"
              className="group flex items-center gap-4 px-8 py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all cursor-pointer"
            >
              All Genres
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {GENRES.slice(0, 11).map((genre, idx) => (
              <motion.button
                key={genre.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() =>
                  navigate(`/genre/${genre.id}?name=${genre.name}`)
                }
                className={cn(
                  "relative group px-6 py-8 rounded-3xl overflow-hidden transition-all duration-500 border border-white/5 active:scale-95 cursor-pointer shadow-skeuo-sm hover:shadow-skeuo-lg",
                  theme === "dark" ? "bg-card-bg/40" : "bg-white/40"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-bg-main/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-500 shadow-inner">
                    <Film className="w-6 h-6 text-text-main/20 group-hover:text-primary transition-colors duration-500" />
                  </div>
                  <span className="font-black text-[11px] tracking-[0.2em] uppercase text-text-main/50 group-hover:text-text-main transition-colors duration-500 text-center">
                    {genre.name}
                  </span>
                </div>
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 11 * 0.03 }}
              onClick={() => navigate("/genres")}
              className={cn(
                "relative group px-6 py-8 rounded-3xl overflow-hidden transition-all duration-500 border border-primary/20 active:scale-95 cursor-pointer bg-primary/5 hover:bg-primary/10 shadow-skeuo-sm",
              )}
            >
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-500">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>
                <span className="font-black text-[11px] tracking-[0.2em] uppercase text-primary text-center">
                  More Genres
                </span>
              </div>
            </motion.button>
          </div>
        </section>

        {/* Discover Segment */}
        <section className="mb-12 md:mb-24">
          <div
            className={cn(
              "skeuo-card p-1 md:p-2 overflow-hidden border-primary/10",
              theme === "dark"
                ? "bg-gradient-to-br from-bg-main to-card-bg"
                : "bg-card-bg",
            )}
          >
            <div
              className={cn(
                "backdrop-blur-3xl p-8 md:p-20 rounded-2xl text-center relative overflow-hidden border border-white/10",
                theme === "dark" ? "bg-card-bg/40" : "bg-white/30",
              )}
            >
              {/* Animated background element */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="w-64 h-64 text-gold animate-pulse" />
              </div>
              
              <div className="relative z-10 w-full">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(229,9,20,0.3)] relative group"
                >
                  <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                  <Globe className="w-12 h-12 text-primary group-hover:rotate-12 transition-transform duration-500" />
                </motion.div>

                <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic bg-gradient-to-b from-text-main to-text-main/40 bg-clip-text text-transparent">
                  ADNFLIX Intelligence
                </h2>

                <div className="max-w-2xl mx-auto mb-12 min-h-[100px] flex flex-col items-center justify-center">
                  <p className="text-text-main/60 text-xl font-medium tracking-tight">
                    {isDiscovering
                      ? "Analyzing neural pathways and cinematic sequences..."
                      : `Discovery engine complete. We've identified hidden ${discoverGenres[0]?.name} and ${discoverGenres[1]?.name} gems.`}
                  </p>
                  
                  {!isDiscovering && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="mt-6 px-6 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3 backdrop-blur-md"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {recommendationReason}
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto relative px-4">
                  <AnimatePresence>
                    {isDiscovering && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg-main/40 backdrop-blur-xl rounded-2xl border border-primary/10"
                      >
                        <div className="relative w-20 h-20 mb-4">
                          <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(229,9,20,0.4)]" />
                        </div>
                        <span className="text-primary text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse">Scanning DNA</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {discover.slice(0, 4).map((movie, idx) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <MovieCard movie={movie} />
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={() => refreshDiscoverGems()}
                  disabled={isDiscovering}
                  className="mt-16 group relative px-12 py-5 rounded-full overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <div className="absolute inset-0 bg-primary group-hover:bg-primary-dark transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <span className="relative z-10 text-white font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-3">
                    {isDiscovering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Neural Scanning...
                      </>
                    ) : (
                      <>
                        Re-Scan Film DNA
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 shadow-[0_0_40px_rgba(229,9,20,0.4)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Section */}
        <section className="mb-16 md:mb-32">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-gold rounded-full shadow-[0_0_25px_rgba(212,175,55,0.3)]" />
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  Popular <span className="text-gold">Hits</span>
                </h2>
                <p className="text-[10px] font-bold text-text-main/30 uppercase tracking-[0.3em] mt-2 ml-1">
                  Highest rated masterpieces across the platform
                </p>
              </div>
            </div>
            <RouterLink
              to="/popular"
              className="group flex items-center gap-4 px-8 py-4 rounded-2xl bg-card-bg border border-text-main/10 text-text-main/60 font-black text-[10px] uppercase tracking-[0.2em] shadow-skeuo-sm hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
            >
              Explore All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {popular.slice(0, 18).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Popular Anime Section */}
        <section className="mb-16 md:mb-32">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_25px_rgba(229,9,20,0.4)]" />
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  Popular <span className="text-primary">Anime</span>
                </h2>
                <p className="text-[10px] font-bold text-text-main/30 uppercase tracking-[0.3em] mt-2 ml-1">
                  The most popular animation hits on ADNFLIX
                </p>
              </div>
            </div>
            <RouterLink
              to="/popular-anime"
              className="group flex items-center gap-4 px-8 py-4 rounded-2xl bg-card-bg border border-text-main/10 text-text-main/60 font-black text-[10px] uppercase tracking-[0.2em] shadow-skeuo-sm hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
            >
              Anime Collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {popularAnime.slice(0, 18).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Popular Korean Section */}
        <section className="mb-16 md:mb-32">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_25px_rgba(229,9,20,0.4)]" />
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  K-Drama <span className="text-primary">& Cinema</span>
                </h2>
                <p className="text-[10px] font-bold text-text-main/30 uppercase tracking-[0.3em] mt-2 ml-1">
                  Experience the wave of Korean storytelling
                </p>
              </div>
            </div>
            <RouterLink
              to="/popular-korean"
              className="group flex items-center gap-4 px-8 py-4 rounded-2xl bg-card-bg border border-text-main/10 text-text-main/60 font-black text-[10px] uppercase tracking-[0.2em] shadow-skeuo-sm hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
            >
              Korean Library
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {popularKoreans.slice(0, 18).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function MovieFeedPage({ feed }: { feed: keyof typeof MOVIE_FEEDS }) {
  const feedConfig = MOVIE_FEEDS[feed];
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");
  const [sortBy, setSortBy] = useState<"popularity" | "rating" | "date">(
    "popularity",
  );

  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore],
  );

  // Reset state when feed or filter changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [feed, filter, sortBy]);

  useEffect(() => {
    const loadMovies = async () => {
      if (page > 1) setLoadingMore(true);

      try {
        const endpoints: { url: string; type: string }[] = [];
        if (filter === "all" || filter === "movie") {
          const sep = feedConfig.movieEndpoint.includes("?") ? "&" : "?";
          endpoints.push({
            url: `${feedConfig.movieEndpoint}${sep}page=${page}`,
            type: "movie",
          });
        }
        if (filter === "all" || filter === "tv") {
          const sep = feedConfig.tvEndpoint.includes("?") ? "&" : "?";
          endpoints.push({
            url: `${feedConfig.tvEndpoint}${sep}page=${page}`,
            type: "tv",
          });
        }

        const results = await Promise.all(
          endpoints.map((e) => fetchMovies(e.url)),
        );

        let newItems: Movie[] = [];
        results.forEach((data, index) => {
          const type = endpoints[index].type;
          const items = (data.results || []).map((m: any) => ({
            ...m,
            media_type: type,
          }));
          newItems = [...newItems, ...items];
        });

        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          setMovies((prev) => {
            const combined = page === 1 ? newItems : [...prev, ...newItems];
            // Sort the combined results
            return [...combined].sort((a, b) => {
              if (sortBy === "popularity") {
                return (b.popularity || 0) - (a.popularity || 0);
              }
              if (sortBy === "rating") {
                return (b.vote_average || 0) - (a.vote_average || 0);
              }
              if (sortBy === "date") {
                const dateA = new Date(
                  a.release_date || (a as any).first_air_date || "1900-01-01",
                ).getTime();
                const dateB = new Date(
                  b.release_date || (b as any).first_air_date || "1900-01-01",
                ).getTime();
                return dateB - dateA;
              }
              return 0;
            });
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    loadMovies();
  }, [page, feed, filter, feedConfig, sortBy]);

  if (loading && page === 1) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg-main pt-20">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Film className="w-6 h-6 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight uppercase">
              {feedConfig.title}
            </h1>
          </div>
          <p className="text-text-main/40 uppercase tracking-widest text-[10px] font-bold">
            {feedConfig.subtitle}
          </p>
        </header>

        {/* Filter & Sort Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex flex-wrap gap-3">
            {(["all", "movie", "tv"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border",
                  filter === f
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-card-bg border-text-main/5 text-text-main/40 hover:text-text-main hover:border-text-main/20",
                )}
              >
                {f === "all"
                  ? "All Content"
                  : f === "movie"
                    ? "Movies"
                    : "TV Series"}
              </button>
            ))}
          </div>

          <CustomDropdown
            options={[
              { id: "popularity", name: "Sort by: Popularity" },
              { id: "rating", name: "Sort by: IMDb Score" },
              { id: "date", name: "Sort by: Release Date" },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            className="min-w-[220px]"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((movie, index) => {
            if (movies.length === index + 1) {
              return (
                <div ref={lastMovieElementRef} key={`${movie.id}-${index}`}>
                  <MovieCard movie={movie} />
                </div>
              );
            }
            return <MovieCard key={`${movie.id}-${index}`} movie={movie} />;
          })}
        </div>

        {loadingMore && (
          <div className="mt-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && movies.length > 0 && (
          <p className="mt-12 text-center text-text-main/20 text-xs font-bold uppercase tracking-[0.2em]">
            You've reached the end of the ADNFLIX index
          </p>
        )}
      </div>
    </div>
  );
}

function GenresPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0].id.toString());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 47 }, (_, index) =>
    (currentYear - index).toString(),
  );
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const goToGenre = () => {
    const genre = GENRES.find((item) => item.id.toString() === selectedGenre);
    if (!genre) return;
    navigate(
      `/genre/${genre.id}?name=${encodeURIComponent(genre.name)}&year=${selectedYear}&lang=${selectedLanguage}`,
    );
  };

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-screen-xl mx-auto">
        <header className="mb-16 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-center md:justify-start gap-4 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <Film className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic">
              Explore <span className="text-primary">Genres</span>
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-text-main/30 uppercase tracking-[0.4em] text-[10px] font-bold ml-1"
          >
            Precision filtering for your next cinematic experience
          </motion.p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "p-8 md:p-12 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl relative",
            theme === "dark" ? "bg-card-bg/40 border-white/5" : "bg-white/40 border-black/5"
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
            <CustomDropdown
              label="Select Genre"
              options={GENRES}
              value={selectedGenre}
              onChange={(val) => setSelectedGenre(val.toString())}
            />
            <CustomDropdown
              label="Release Year"
              options={years.map((y) => ({ id: y, name: y }))}
              value={selectedYear}
              onChange={(val) => setSelectedYear(val.toString())}
            />
            <CustomDropdown
              label="Original Language"
              options={LANGUAGES.map((l) => ({ id: l.code, name: l.name }))}
              value={selectedLanguage}
              onChange={(val) => setSelectedLanguage(val.toString())}
            />
            <button
              onClick={goToGenre}
              className="group relative h-[60px] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xl shadow-primary/20"
            >
              <div className="absolute inset-0 bg-primary group-hover:bg-primary-dark transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
              <span className="relative z-10 text-white text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                Open Index
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-8 justify-center md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-text-main/20 uppercase tracking-widest">Global TMDB Database</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-text-main/20 uppercase tracking-widest">AI Ranked Discovery</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-text-main/20 uppercase tracking-widest">HD Metadata</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Tips */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "DNA Search", desc: "Filter by genre to match your cinematic sequence." },
            { title: "Retro Mode", desc: "Browse classics by selecting older release years." },
            { title: "Global Cinema", desc: "Switch languages to explore international masterpieces." }
          ].map((tip, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-6 rounded-2xl border border-white/5 bg-white/2 hover:border-primary/20 transition-colors"
            >
              <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-2">{tip.title}</h3>
              <p className="text-text-main/40 text-xs leading-relaxed">{tip.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    movieTitle?: string;
  } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast(e.detail);
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    };
    window.addEventListener("adnflix_toast" as any, handleToast);
    return () =>
      window.removeEventListener("adnflix_toast" as any, handleToast);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <ThemeProvider>
      <Router>
        <div className="bg-bg-main min-h-screen text-text-main selection:bg-primary/30 selection:text-white transition-colors duration-500 ease-in-out">
          <ScrollToTop />
          
          <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

          <div className="flex">
            <Sidebar 
              isOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
            />

            <motion.div 
              animate={{ 
                marginLeft: isSidebarOpen ? 320 : 0,
                width: isSidebarOpen ? "calc(100% - 320px)" : "100%"
              }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="flex-1 min-h-screen flex flex-col relative"
            >
              <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movies/:id/cast" element={<CastPage />} />
                <Route path="/movies/:id" element={<MovieDetail />} />
                <Route path="/person/:id" element={<PersonPage />} />
                <Route path="/genre/:id" element={<GenrePage />} />
                <Route path="/genres" element={<GenresPage />} />
                <Route
                  path="/trending"
                  element={<MovieFeedPage feed="trending" />}
                />
                <Route path="/popular" element={<MovieFeedPage feed="popular" />} />
                <Route
                  path="/popular-anime"
                  element={<MovieFeedPage feed="anime" />}
                />
                <Route
                  path="/popular-korean"
                  element={<MovieFeedPage feed="korean" />}
                />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route
                  path="/about"
                  element={
                    <div className="pt-32 pb-20 px-8 max-w-4xl mx-auto">
                      <h1 className="text-4xl font-bold mb-8 font-serif">About <span className="text-primary italic">ADNFLIX</span></h1>
                      <div className="space-y-6 text-text-main/70 leading-relaxed text-lg">
                        <p>
                          ADNFLIX is a cutting-edge movie discovery platform designed for the cinematic individual. 
                          Our mission is to decode the vast landscape of global film and deliver precision 
                          recommendations that resonate with your unique "Cinematic DNA."
                        </p>
                        <p>
                          Built with the modern viewer in mind, we leverage high-performance technology 
                          and the extensive TMDB database to provide a seamless, high-fidelity browsing 
                          experience. Whether you're looking for global blockbusters or hidden indie gems, 
                          ADNFLIX is your primary source for high-resolution storytelling.
                        </p>
                        <div className="pt-8 border-t border-white/5">
                          <p className="text-sm font-mono uppercase tracking-widest text-text-main/40">
                            Powered by ADN1SK Studios • Est. 2024
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <div className="pt-32 pb-20 px-8 max-w-4xl mx-auto">
                      <h1 className="text-4xl font-bold mb-8 font-serif">Terms & <span className="text-primary italic">Conditions</span></h1>
                      <div className="space-y-8 text-text-main/70 leading-relaxed">
                        <section>
                          <h2 className="text-xl font-bold text-text-main mb-4 uppercase tracking-wider">1. Acceptance of Terms</h2>
                          <p>By accessing ADNFLIX, you agree to be bound by these Terms and Conditions. Our platform is provided "as is" for personal, non-commercial entertainment purposes.</p>
                        </section>
                        <section>
                          <h2 className="text-xl font-bold text-text-main mb-4 uppercase tracking-wider">2. Content & Metadata</h2>
                          <p>All movie metadata, images, and trailers are provided via the TMDB API. ADNFLIX does not claim ownership of the cinematic content displayed, which remains the property of their respective copyright holders.</p>
                        </section>
                        <section>
                          <h2 className="text-xl font-bold text-text-main mb-4 uppercase tracking-wider">3. User Conduct</h2>
                          <p>Users are expected to use the platform responsibly. Any attempt to scrape data, disrupt service, or reverse engineer the ADNFLIX core engine is strictly prohibited.</p>
                        </section>
                      </div>
                    </div>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <div className="pt-32 pb-20 px-8 max-w-4xl mx-auto">
                      <h1 className="text-4xl font-bold mb-8 font-serif">Privacy <span className="text-primary italic">Policy</span></h1>
                      <div className="space-y-8 text-text-main/70 leading-relaxed">
                        <section>
                          <h2 className="text-xl font-bold text-text-main mb-4 uppercase tracking-wider">Data Encryption</h2>
                          <p>Your privacy is hardcoded into our DNA. ADNFLIX uses localized storage (LocalStorage) to keep your Watchlist and Favorites strictly on your own device.</p>
                        </section>
                        <section>
                          <h2 className="text-xl font-bold text-text-main mb-4 uppercase tracking-wider">No Third-Party Tracking</h2>
                          <p>We do not sell, trade, or transfer your personal information to outside parties. Your cinematic preferences are your own business.</p>
                        </section>
                        <section>
                          <h2 className="text-xl font-bold text-text-main mb-4 uppercase tracking-wider">Security</h2>
                          <p>We implement a variety of security measures to maintain the safety of your personal experience when you enter, submit, or access the ADNFLIX dashboard.</p>
                        </section>
                      </div>
                    </div>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <div className="pt-32 px-8 text-center text-text-main/40 uppercase tracking-widest font-bold">
                      Contact ADNFLIX
                    </div>
                  }
                />
              </Routes>
            </main>

            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl bg-card-bg/95 backdrop-blur-xl border border-primary/20 shadow-skeuo-lg flex items-center gap-3 whitespace-nowrap pointer-events-none"
                >
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm font-bold tracking-tight">
                    <span className="text-text-main/60 mr-1">
                      {toast.message}
                    </span>
                    {toast.movieTitle && (
                      <span className="text-primary italic truncate max-w-[180px] inline-block align-bottom">
                        {toast.movieTitle}
                      </span>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <LayoutFooter />
          </motion.div>
        </div>

        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 p-4 rounded-full bg-card-bg/80 backdrop-blur-md border border-white/10 text-primary shadow-skeuo-lg hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group"
              title="Back to Top"
            >
              <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </Router>
  </ThemeProvider>
  );
}

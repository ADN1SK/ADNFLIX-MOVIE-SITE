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
import Footer from "./components/layout/Footer";
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
import { TMDB_CONFIG } from "./constants";
import { useTheme } from "./lib/ThemeContext";

// TMDB ID Map
const GENRES = [
  { id: 28, name: "Action" },
  { id: 878, name: "Sci-Fi" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 35, name: "Comedy" },
  { id: 53, name: "Thriller" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "zh", name: "Chinese" },
];

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
  const [popularAnime, setPopularAnime] = useState<Movie[]>([]); // New state for popular anime
  const [popularKoreans, setPopularKoreans] = useState<Movie[]>([]); // New state for popular koreans
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverGenre, setDiscoverGenre] = useState(GENRES[0]);
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

  const refreshDiscoverGems = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsDiscovering(true);
    try {
      const watchlist = JSON.parse(
        localStorage.getItem("adnflix_watchlist") || "[]",
      );
      const favorites = JSON.parse(
        localStorage.getItem("adnflix_favorites") || "[]",
      );
      const allSaved = [...watchlist, ...favorites];

      let targetGenre = GENRES[Math.floor(Math.random() * GENRES.length)];

      if (allSaved.length > 0) {
        const genreCounts: Record<number, number> = {};
        allSaved.forEach((m: any) => {
          if (m.genre_ids) {
            m.genre_ids.forEach((id: number) => {
              genreCounts[id] = (genreCounts[id] || 0) + 1;
            });
          }
        });

        const topGenre = GENRES.map((g) => ({
          ...g,
          count: genreCounts[g.id] || 0,
        })).sort((a, b) => b.count - a.count)[0];

        if (topGenre.count > 0) targetGenre = topGenre;
      }

      setDiscoverGenre(targetGenre);
      // "Hidden Gems" Logic: High rating (>= 7), but lower vote counts (500-3000)
      // to avoid just showing the most famous blockbusters.
      const endpoint = `discover/movie?with_genres=${targetGenre.id}&sort_by=vote_average.desc&vote_count.gte=500&vote_count.lte=3500`;
      const data = await fetchMovies(endpoint);
      setDiscover(data.results?.slice(0, 4) || []);
    } catch (err) {
      console.error("Intelligence Scan Failed:", err);
    } finally {
      if (!isInitial) {
        // Artificial delay for the "processing" feel
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
        <section className="mb-12 md:mb-24">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
              <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">
                Trending locally on{" "}
                <span className="text-primary italic">ADNFLIX</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <RouterLink
                to="/trending"
                className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:underline flex items-center gap-2 bg-primary/5 px-3 py-2 md:px-6 md:py-3 rounded-full border border-primary/20 shadow-skeuo-sm transition-all hover:shadow-skeuo-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
              >
                Explore More
              </RouterLink>
              <div className="flex gap-2">
                <button
                  onClick={() => scroll("left")}
                  className="p-2.5 rounded-full bg-card-bg border border-text-main/10 hover:border-primary/50 transition-all shadow-skeuo-sm active:shadow-skeuo-inner group cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-text-main/40 group-hover:text-primary" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="p-2.5 rounded-full bg-card-bg border border-text-main/10 hover:border-primary/50 transition-all shadow-skeuo-sm active:shadow-skeuo-inner group cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-text-main/40 group-hover:text-primary" />
                </button>
              </div>
            </div>
          </div>
          <div
            ref={trendingRef}
            className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide snap-x px-1"
          >
            {trending.slice(1, 13).map((movie) => (
              <div
                key={movie.id}
                className="min-w-[160px] sm:min-w-[200px] md:min-w-[240px] snap-start"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>

        {/* Genre Showcase */}
        <section className="mb-12 md:mb-24">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-1.5 h-8 bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
            <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">
              Curated Genres
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() =>
                  navigate(`/genre/${genre.id}?name=${genre.name}`)
                }
                className="px-8 py-5 rounded-2xl bg-card-bg shadow-skeuo-sm border border-text-main/10 hover:shadow-skeuo-lg hover:border-primary/30 transition-all group flex items-center gap-3 active:translate-y-0.5 cursor-pointer"
              >
                <Film className="w-4 h-4 text-text-main/20 group-hover:text-primary transition-colors" />
                <span className="font-bold text-sm tracking-widest uppercase">
                  {genre.name}
                </span>
              </button>
            ))}
            <RouterLink
              to="/genres"
              className="px-8 py-5 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold shadow-lg shadow-primary/5 hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
            >
              ALL CATEGORIES <ChevronRight className="w-4 h-4" />
            </RouterLink>
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
                "backdrop-blur-xl p-6 md:p-16 rounded-lg text-center relative overflow-hidden",
                theme === "dark" ? "bg-card-bg/50" : "bg-white/40",
              )}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="w-64 h-64 text-gold" />
              </div>
              <div className="relative z-10 w-full">
                <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(229,9,20,0.2)]">
                  <Globe className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter uppercase">
                  ADNFLIX Intelligence
                </h2>
                <p className="text-text-main/50 max-w-2xl mx-auto mb-10 text-lg h-20 flex items-center justify-center">
                  {isDiscovering
                    ? "Analyzing neural pathways and cinematic sequences..."
                    : `Discovery engine complete. We've identified hidden ${discoverGenre.name} gems tailored to your unique film DNA.`}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto relative">
                  <AnimatePresence>
                    {isDiscovering && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex items-center justify-center bg-bg-main/60 backdrop-blur-md rounded-xl border border-primary/20"
                      >
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(229,9,20,0.3)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {discover.slice(0, 4).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
                <button
                  onClick={() => refreshDiscoverGems()}
                  disabled={isDiscovering}
                  className="mt-12 px-10 py-4 rounded-full bg-primary text-white font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 transition-all text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDiscovering ? "Neural Scanning..." : "Re-Scan Film DNA"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Section */}
        <section className="mb-12 md:mb-24">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
              <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">
                Popular Hits
              </h2>
            </div>
            <RouterLink
              to="/popular"
              className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:underline flex items-center gap-2 bg-primary/5 px-6 py-3 rounded-full border border-primary/20 shadow-skeuo-sm transition-all hover:shadow-skeuo-md active:translate-y-0.5 cursor-pointer"
            >
              Explore More
            </RouterLink>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {popular.slice(0, 18).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Popular Anime Section - NEW */}
        <section className="mb-12 md:mb-24">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
              <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">
                Popular Anime
              </h2>
            </div>
            <RouterLink
              to="/popular-anime"
              className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:underline flex items-center gap-2 bg-primary/5 px-6 py-3 rounded-full border border-primary/20 shadow-skeuo-sm transition-all hover:shadow-skeuo-md active:translate-y-0.5 cursor-pointer"
            >
              Explore More
            </RouterLink>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {popularAnime.slice(0, 18).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Popular Korean Section - NEW */}
        <section className="mb-12 md:mb-24">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
              <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">
                K-Drama & Cinema
              </h2>
            </div>
            <RouterLink
              to="/popular-korean"
              className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:underline flex items-center gap-2 bg-primary/5 px-6 py-3 rounded-full border border-primary/20 shadow-skeuo-sm transition-all hover:shadow-skeuo-md active:translate-y-0.5 cursor-pointer"
            >
              Explore More
            </RouterLink>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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

          <div className="relative min-w-[220px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-card-bg border border-text-main/10 rounded-xl px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-main/60 outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
            >
              <option value="popularity">Sort by: Popularity</option>
              <option value="rating">Sort by: IMDb Score</option>
              <option value="date">Sort by: Release Date</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="w-4 h-4 text-text-main/20 rotate-90" />
            </div>
          </div>
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
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Film className="w-6 h-6 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight uppercase">
              Genres
            </h1>
          </div>
          <p className="text-text-main/40 uppercase tracking-widest text-[10px] font-bold">
            Choose a genre and year for its ADNFLIX collection
          </p>
        </header>

        <div className="skeuo-card p-6 md:p-8 flex flex-col md:flex-row gap-4 md:items-center">
          <select
            value={selectedGenre}
            onChange={(event) => setSelectedGenre(event.target.value)}
            className="w-full md:max-w-sm rounded-xl bg-bg-main border border-text-main/10 px-4 py-3 text-sm font-bold text-text-main outline-none focus:border-primary/50"
          >
            {GENRES.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="w-full md:max-w-40 rounded-xl bg-bg-main border border-text-main/10 px-4 py-3 text-sm font-bold text-text-main outline-none focus:border-primary/50"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
            className="w-full md:max-w-40 rounded-xl bg-bg-main border border-text-main/10 px-4 py-3 text-sm font-bold text-text-main outline-none focus:border-primary/50"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            onClick={goToGenre}
            className="px-8 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer"
          >
            Browse Genre
          </button>
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
            <Footer />
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

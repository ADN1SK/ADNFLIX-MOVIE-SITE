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
import Navbar from "./components/layout/Navbar";
import { useEffect, useState, useRef } from "react";
import { Movie } from "./types";
import Hero from "./components/movies/Hero";
import MovieCard from "./components/movies/MovieCard";
import { ChevronRight, ChevronLeft, Film, Globe, Sparkles } from "lucide-react";
import MovieDetail from "./components/movies/MovieDetail";
import Dashboard from "./components/layout/Dashboard";
import GenrePage from "./components/movies/GenrePage";
import SearchPage from "./components/movies/SearchPage";
import { ThemeProvider } from "./lib/ThemeContext";
import { TMDB_CONFIG } from "./constants";

// TMDB ID Map
const GENRES = [
  { id: 28, name: "Action" },
  { id: 878, name: "Sci-Fi" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 35, name: "Comedy" },
  { id: 53, name: "Thriller" },
];

const MOVIE_FEEDS = {
  trending: {
    title: "Trending Movies",
    subtitle: "What ADNFLIX viewers are watching right now",
    endpoint: "trending/movie/week",
  },
  popular: {
    title: "Popular Movies",
    subtitle: "The biggest hits across the ADNFLIX database",
    endpoint: "movie/popular",
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const trendingRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [trendingData, popularData, discoverData] = await Promise.all([
          fetchMovies("trending/movie/week"),
          fetchMovies("movie/popular"),
          fetchMovies(
            "discover/movie?sort_by=vote_average.desc&vote_count.gte=1000",
          ),
        ]);
        setTrending(trendingData.results || []);
        setPopular(popularData.results || []);
        setDiscover(discoverData.results || []);
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
      <div className="h-screen w-full flex items-center justify-center bg-bg-main transition-colors">
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
      {trending[0] && <Hero movie={trending[0]} />}

      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 -mt-16 relative z-20">
        {/* Trending Section */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
              <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">
                Trending locally on{" "}
                <span className="text-primary italic">ADNFLIX</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                className="p-2.5 rounded-full bg-charcoal border border-white/5 hover:border-primary/50 transition-all shadow-skeuo-sm active:shadow-skeuo-inner group"
              >
                <ChevronLeft className="w-5 h-5 text-cream/40 group-hover:text-primary" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-2.5 rounded-full bg-charcoal border border-white/5 hover:border-primary/50 transition-all shadow-skeuo-sm active:shadow-skeuo-inner group"
              >
                <ChevronRight className="w-5 h-5 text-cream/40 group-hover:text-primary" />
              </button>
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
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-8">
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
                className="px-8 py-5 rounded-2xl bg-charcoal shadow-skeuo-sm border border-white/5 hover:shadow-skeuo-lg hover:border-primary/30 transition-all group flex items-center gap-3 active:translate-y-0.5"
              >
                <Film className="w-4 h-4 text-cream/20 group-hover:text-primary transition-colors" />
                <span className="font-bold text-sm tracking-widest uppercase">
                  {genre.name}
                </span>
              </button>
            ))}
            <RouterLink
              to="/genres"
              className="px-8 py-5 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold shadow-lg shadow-primary/5 hover:scale-105 transition-transform flex items-center gap-2"
            >
              ALL CATEGORIES <ChevronRight className="w-4 h-4" />
            </RouterLink>
          </div>
        </section>

        {/* Discover Segment */}
        <section className="mb-24">
          <div className="skeuo-card p-1 md:p-2 overflow-hidden bg-gradient-to-br from-bg-main to-card-bg border-primary/10">
            <div className="bg-card-bg/50 backdrop-blur-xl p-12 md:p-16 rounded-lg text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="w-64 h-64 text-gold" />
              </div>
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(229,9,20,0.2)]">
                  <Globe className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter uppercase">
                  ADNFLIX Intelligence
                </h2>
                <p className="text-cream/50 max-w-2xl mx-auto mb-10 text-lg">
                  Our discovery engine analyzes global cinematic trends to
                  provide you with hidden gems you won't find anywhere else.
                  Ready to expand your film DNA?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {discover.slice(0, 4).map((movie) => (
                    <RouterLink
                      key={movie.id}
                      to={`/movies/${movie.id}`}
                      className="group"
                    >
                      <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 skeuo-card border-none shadow-sm group-hover:shadow-skeuo-md transition-all">
                        <img
                          src={`${TMDB_CONFIG.IMG_BASE_URL}/w342${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cream/40 group-hover:text-primary transition-colors truncate block">
                        {movie.title}
                      </span>
                    </RouterLink>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/search")}
                  className="mt-12 px-10 py-4 rounded-full bg-primary text-white font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 transition-all text-xs"
                >
                  Deep Scan Database
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Section */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
              <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">
                Popular Hits
              </h2>
            </div>
            <RouterLink
              to="/genre/popular"
              className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:underline flex items-center gap-2 bg-primary/5 px-6 py-3 rounded-full border border-primary/20 shadow-skeuo-sm transition-all hover:shadow-skeuo-md active:translate-y-0.5"
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
      </main>
    </div>
  );
}

function MovieFeedPage({ feed }: { feed: keyof typeof MOVIE_FEEDS }) {
  const feedConfig = MOVIE_FEEDS[feed];
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      try {
        const data = await fetchMovies(feedConfig.endpoint);
        setMovies(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, [feedConfig.endpoint]);

  if (loading) {
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
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

  const goToGenre = () => {
    const genre = GENRES.find((item) => item.id.toString() === selectedGenre);
    if (!genre) return;
    navigate(
      `/genre/${genre.id}?name=${encodeURIComponent(genre.name)}&year=${selectedYear}`,
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
          <button
            onClick={goToGenre}
            className="px-8 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            Browse Genre
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="bg-bg-main min-h-screen text-text-main selection:bg-primary/30 selection:text-white transition-colors">
          <ScrollToTop />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/genre/:id" element={<GenrePage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/trending" element={<MovieFeedPage feed="trending" />} />
            <Route path="/popular" element={<MovieFeedPage feed="popular" />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/login"
              element={
                <div className="pt-32 px-8 text-center text-text-main/40 uppercase tracking-widest font-bold">
                  ADNFLIX Auth Entry
                </div>
              }
            />
            <Route
              path="/about"
              element={
                <div className="pt-32 px-8 text-center text-text-main/40 uppercase tracking-widest font-bold">
                  About ADNFLIX
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

          {/* Footer */}
          <footer className="border-t border-white/5 bg-card-bg/30 py-20 px-8">
            <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
              <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
                <RouterLink
                  to="/"
                  className="text-3xl font-bold tracking-tighter"
                >
                  ADN<span className="text-primary italic">FLIX</span>
                </RouterLink>
                <p className="text-text-main/20 text-[10px] uppercase tracking-[0.2em] font-bold leading-relaxed max-w-xs">
                  Your DNA in Film. Precision delivery for the cinematic
                  individual. Unveiling the code behind every masterpiece.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-8">
                <div className="flex flex-wrap justify-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40">
                  <RouterLink
                    to="/about"
                    className="hover:text-primary transition-all"
                  >
                    About Us
                  </RouterLink>
                  <RouterLink
                    to="/genre/28"
                    className="hover:text-primary transition-all"
                  >
                    Action
                  </RouterLink>
                  <RouterLink
                    to="/genre/878"
                    className="hover:text-primary transition-all"
                  >
                    Sci-Fi
                  </RouterLink>
                  <RouterLink
                    to="/contact"
                    className="hover:text-primary transition-all"
                  >
                    Inquiries
                  </RouterLink>
                  <a href="#" className="hover:text-primary transition-all">
                    Watchlist
                  </a>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-4 text-text-main/20">
                    <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center hover:border-primary/50 cursor-pointer transition-colors">
                      🧬
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center hover:border-primary/50 cursor-pointer transition-colors">
                      🎬
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center hover:border-primary/50 cursor-pointer transition-colors">
                      🎥
                    </div>
                  </div>
                  <p className="text-text-main/10 text-[10px] font-mono tracking-widest">
                    © 2024 ADNFLIX STUDIOS. VER 2.0.4
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
}

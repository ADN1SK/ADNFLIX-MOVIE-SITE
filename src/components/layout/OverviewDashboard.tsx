import React, { useMemo } from "react";
import { GENRES } from "@/src/constants";
import { Movie } from "@/src/types";
import { motion } from "motion/react";
import { 
  BarChart3, 
  Clock, 
  PieChart as PieChartIcon, 
  Activity, 
  Film, 
  Star, 
  Calendar, 
  MessageSquare, 
  Heart, 
  Bookmark,
  TrendingUp,
  Zap,
  Dna
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface OverviewDashboardProps {
  userName?: string;
  history: Movie[];
  watchlist: Movie[];
  favorites: Movie[];
  reviews?: any[];
}

// Custom Pie Chart Component
const AnimatedPieChart = ({ data }: { data: { name: string, percentage: number, color: string }[] }) => {
  let cumulativePercentage = 0;
  
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((slice, i) => {
          const startAngle = (cumulativePercentage * 360) / 100;
          cumulativePercentage += slice.percentage;
          const endAngle = (cumulativePercentage * 360) / 100;
          
          // SVG Arc calculation
          const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
          const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
          const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
          const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);
          
          const largeArcFlag = slice.percentage > 50 ? 1 : 0;
          const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          
          return (
            <motion.path
              key={slice.name}
              d={d}
              fill={slice.color}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
              className="cursor-pointer stroke-bg-main stroke-1"
            />
          );
        })}
        {/* Inner Hole for Donut effect */}
        <circle cx="50" cy="50" r="25" className="fill-card-bg/90 backdrop-blur-xl" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <Dna className="w-8 h-8 text-primary/40 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-main/30">Profile</span>
      </div>
    </div>
  );
};

export default function OverviewDashboard({ 
  userName = "Cinema Enthusiast", 
  history, 
  watchlist, 
  favorites, 
  reviews = [] 
}: OverviewDashboardProps) {
  
  const colors = ["#e50914", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#6366f1"];

  // Compute Genre Distribution
  const genreStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const allMovies = [...history, ...favorites, ...watchlist];
    
    allMovies.forEach(movie => {
      if (movie.genre_ids) {
        movie.genre_ids.forEach(id => {
          const genre = GENRES.find(g => g.id === id);
          if (genre) {
            counts[genre.name] = (counts[genre.name] || 0) + 1;
          }
        });
      } else if (movie.genres) {
        movie.genres.forEach(g => {
          counts[g.name] = (counts[g.name] || 0) + 1;
        });
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[i % colors.length]
      }));
  }, [history, watchlist, favorites]);

  // Compute Era/Decade Stats
  const eraStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const allMovies = [...history, ...favorites]; 
    
    allMovies.forEach(movie => {
      if (movie.release_date) {
        const year = parseInt(movie.release_date.split("-")[0]);
        if (!isNaN(year)) {
          const decade = Math.floor(year / 10) * 10;
          counts[`${decade}s`] = (counts[`${decade}s`] || 0) + 1;
        }
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [history, favorites]);

  // Weekly Activity (Real data calculation)
  const weeklyActivity = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    
    // Create last 7 days map
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return {
        dateStr: d.toDateString(),
        label: dayNames[d.getDay()],
        count: 0
      };
    });

    // Count history views
    history.forEach(item => {
      if (item.watched_at) {
        const d = new Date(item.watched_at).toDateString();
        const day = last7Days.find(ld => ld.dateStr === d);
        if (day) day.count++;
      }
    });

    // Count reviews
    reviews.forEach(item => {
      if (item.created_at) {
        const d = new Date(item.created_at).toDateString();
        const day = last7Days.find(ld => ld.dateStr === d);
        if (day) day.count++;
      }
    });

    // Count favorites/watchlist (stored in favorites prop for this component)
    favorites.forEach(item => {
      if ((item as any).created_at) {
        const d = new Date((item as any).created_at).toDateString();
        const day = last7Days.find(ld => ld.dateStr === d);
        if (day) day.count++;
      }
    });

    return last7Days.map(d => ({ day: d.label, value: d.count }));
  }, [history, reviews, favorites]);

  const maxActivity = Math.max(...weeklyActivity.map(d => d.value), 1);

  return (
    <div className="space-y-8">
      
      {/* Premium Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] p-10 bg-gradient-to-br from-primary/30 via-card-bg to-bg-main border border-primary/20 shadow-skeuo-lg relative overflow-hidden group"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Cinematic Intelligence</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Welcome back,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">{userName}</span>
            </h2>
            <p className="text-text-main/50 text-sm max-w-md leading-relaxed">
              Your cinematic DNA has evolved. You've explored <span className="text-text-main font-bold">{history.length} titles</span> across {genreStats.length} genres. Ready for your next masterpiece?
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-center min-w-[120px]">
                <p className="text-3xl font-black text-white">{history.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-main/30 mt-1">Explored</p>
             </div>
             <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 backdrop-blur-md text-center min-w-[120px]">
                <p className="text-3xl font-black text-primary">{watchlist.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mt-1">Queued</p>
             </div>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" 
        />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
      </motion.div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Activity Visualizer */}
        <div className="lg:col-span-2 rounded-3xl border border-text-main/10 bg-card-bg/40 p-8 shadow-skeuo-sm backdrop-blur-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Activity Pulse
              </h3>
              <p className="text-[10px] text-text-main/30 font-bold uppercase tracking-tight">Engagement metrics for the past week</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-text-main/60 uppercase">Live Data</span>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 px-4 relative">
             {/* Subtle Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 opacity-20">
                {[1, 2, 3].map(i => <div key={i} className="w-full h-px bg-text-main/10 border-dashed" />)}
             </div>

            {weeklyActivity.map((day, i) => {
              const heightPercent = (day.value / maxActivity) * 100;
              return (
                <div key={day.day} className="flex flex-col items-center gap-4 flex-1 group/bar z-10">
                  <div className="w-full relative h-full flex items-end justify-center">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 1, delay: i * 0.1, type: "spring", stiffness: 60 }}
                      className={cn(
                        "w-full max-w-[45px] rounded-2xl transition-all duration-500 relative",
                        day.value > 0 ? "bg-gradient-to-t from-primary/80 to-primary group-hover/bar:from-primary group-hover/bar:to-primary/80" : "bg-text-main/5"
                      )}
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: day.value > 0 ? '12%' : '4px',
                        boxShadow: day.value > 0 ? '0 10px 30px -10px rgba(229,9,20,0.5)' : 'none'
                      }}
                    >
                       {/* Value Tooltip */}
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-bg-main text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-xl">
                          {day.value}
                       </div>
                    </motion.div>
                  </div>
                  <span className="text-[11px] font-black uppercase text-text-main/20 group-hover/bar:text-primary transition-colors">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Era Stats */}
        <div className="rounded-3xl border border-text-main/10 bg-card-bg/40 p-8 shadow-skeuo-sm backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-black uppercase tracking-widest">Era Analysis</h3>
          </div>
          
          <div className="flex-1 space-y-8">
            {eraStats.length > 0 ? (
              eraStats.map(([decade, count], i) => {
                const maxEra = eraStats[0][1];
                const width = (count / maxEra) * 100;
                
                return (
                  <div key={decade} className="group/era">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="text-xl font-black text-white group-hover/era:text-purple-500 transition-colors">{decade}</span>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-text-main/30">Temporal affinity</p>
                      </div>
                      <span className="text-xs font-black text-text-main/50">{count} Titles</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 1.2, delay: 0.5 + i * 0.1, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <Calendar className="w-10 h-10 text-text-main/10" />
                <p className="text-xs text-text-main/30 italic px-6">Watch more movies to unlock your era analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Cinematic DNA (Pie Chart Overhaul) */}
      <div className="rounded-[2.5rem] border border-text-main/10 bg-card-bg/60 p-10 shadow-skeuo-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-12">
          
          <div className="flex-1 space-y-8">
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <Dna className="w-6 h-6 text-primary" /> Your Cinematic DNA
                </h3>
                <p className="text-sm text-text-main/40 max-w-sm">
                  A deep-dive into your stylistic preferences across the entire ADNFLIX catalog.
                </p>
             </div>

             {genreStats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                  {genreStats.map((genre, i) => (
                    <div key={genre.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: genre.color }} />
                          <span className="text-xs font-black uppercase tracking-wider text-text-main/80">{genre.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-text-main/40">{genre.percentage}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${genre.percentage}%` }}
                          transition={{ duration: 1.5, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: genre.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <p className="text-sm text-text-main/30 italic">No genetic data available yet.</p>
             )}
          </div>

          <div className="shrink-0 flex items-center justify-center p-4 bg-white/5 rounded-[3rem] border border-white/5 backdrop-blur-sm">
             {genreStats.length > 0 ? (
                <AnimatedPieChart data={genreStats} />
             ) : (
                <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center border-4 border-dashed border-white/5 rounded-full">
                   <Zap className="w-10 h-10 text-white/5" />
                </div>
             )}
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { clearUserSession, decodeJwtPayload } from "@/src/lib/authSession";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [userName, setUserName] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const { left, top, width, height } =
        cardRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          data = { error: text };
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `Login failed: ${response.statusText}`);
      }

      clearUserSession();
      localStorage.setItem("adnflix_auth_token", data.token);
      localStorage.setItem(
        "adnflix_user_id",
        String(data.id ?? data.userId ?? ""),
      );
      localStorage.setItem("adnflix_user_name", data.name || "");
      console.info("[AUTH] login", {
        userId: data.id ?? data.userId ?? null,
        jwtPayload: decodeJwtPayload(data.token),
        requestUrl: "/api/auth/login",
        responseData: data,
      });
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: {
            message: "Authentication Successful",
            movieTitle: "Welcome Back",
          },
        }),
      );
      navigate("/");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050505] py-10 px-4">
      {/* Back to Home Button - Top Left */}
      <div className="absolute top-8 left-4 md:left-12 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-3 text-text-main/40 hover:text-primary transition-all group"
        >
          <div className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] hidden sm:block">
            Home
          </span>
        </Link>
      </div>

      {/* Background Elements - Simplified for mobile */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse"
          style={{
            transform: `translate3d(${mousePos.x * -50}px, ${mousePos.y * -50}px, -100px)`,
          }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mb-4 shadow-[0_0_20px_rgba(229,9,20,0.2)]">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-1 uppercase text-white">
                Account Login
              </h1>
              <p className="text-primary/60 text-[9px] font-bold uppercase tracking-[0.3em]">
                Enter your credentials
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-main/40 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-main/40">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-main/30 hover:text-primary transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-main/40">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  ChevronLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const { left, top, width, height } = cardRef.current.getBoundingClientRect();
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

    // Mock login delay
    setTimeout(() => {
      if (email === "test@example.com" && password === "password") {
        localStorage.setItem("adnflix_auth_token", "mock_jwt_token_12345");
        window.dispatchEvent(new CustomEvent("adnflix_toast", { 
          detail: { message: "Authentication Successful", movieTitle: "Welcome Back" } 
        }));
        navigate("/dashboard");
      } else {
        setError("Invalid credentials. Use test@example.com / password");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050505] perspective-[2000px] py-20 px-4">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" 
          style={{
            transform: `translate3d(${mousePos.x * -50}px, ${mousePos.y * -50}px, -100px)`
          }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, rotateX: 20, y: 50 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10 preserve-3d"
      >
        {/* Navigation Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-text-main/40 hover:text-primary transition-all mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Neural Link Exit</span>
        </Link>

        {/* 3D Glass Card */}
        <div 
          ref={cardRef}
          className="relative group transition-transform duration-200 ease-out"
          style={{
            transform: `rotateY(${mousePos.x * 20}deg) rotateX(${mousePos.y * -20}deg)`,
            transformStyle: "preserve-3d"
          }}
        >
          {/* Card Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 to-transparent rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
          
          <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            {/* Holographic Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan" />
            
            <div className="p-8 md:p-12">
              {/* Header */}
              <div className="text-center mb-10" style={{ transform: "translateZ(50px)" }}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mb-6 shadow-[0_0_30px_rgba(229,9,20,0.2)]">
                  <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase text-white">Identity Check</h1>
                <p className="text-primary/60 text-[10px] font-bold uppercase tracking-[0.4em] mb-1">
                  Secure Protocol Active
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-8" style={{ transform: "translateZ(30px)" }}>
                <div className="space-y-3">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-main/40 ml-1">
                    Universal Identification
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30 group-focus-within:text-primary transition-all" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ACCESS_KEY@NODE.SYS"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-main/40">
                      Encrypted Cipher
                    </label>
                    <button type="button" className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/40 hover:text-primary transition-colors cursor-pointer">
                      RECOVER
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30 group-focus-within:text-primary transition-all" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-main/30 hover:text-primary transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center"
                    >
                      <p className="text-[9px] font-bold text-primary uppercase tracking-widest leading-relaxed">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group/btn overflow-hidden py-5 rounded-2xl bg-primary text-white font-bold uppercase tracking-[0.3em] text-xs shadow-[0_0_40px_rgba(229,9,20,0.3)] hover:shadow-primary/50 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Initialize Connection
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                </button>
              </form>

              <div className="mt-10 text-center" style={{ transform: "translateZ(20px)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/20">
                  New Unit? <a href="#" className="text-primary hover:text-primary/80 transition-colors">Register Neural Path</a>
                </p>
              </div>
            </div>
          </div>
          
          {/* Card Depth Elements */}
          <div className="absolute top-0 left-0 w-full h-full border border-white/5 rounded-[2rem] pointer-events-none -translate-z-[1px]" />
        </div>

        {/* Technical Metadata */}
        <div className="mt-12 flex justify-between px-2 opacity-20 font-mono text-[8px] tracking-[0.4em] uppercase text-text-main">
          <span>ADNFLIX_V2.0</span>
          <span>LATENCY: 12ms</span>
          <span>AUTH_STATUS: ENCRYPTED</span>
        </div>
      </motion.div>
      
      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .perspective-2000 { perspective: 2000px; }
        .-translate-z-\\[1px\\] { transform: translateZ(-1px); }
        .translate-z-\\[20px\\] { transform: translateZ(20px); }
        .translate-z-\\[30px\\] { transform: translateZ(30px); }
        .translate-z-\\[50px\\] { transform: translateZ(50px); }
        
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(1000%); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}



/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Chrome, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  ChevronLeft,
  Github
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Mock login delay
    setTimeout(() => {
      if (email === "test@example.com" && password === "password") {
        // Mock JWT Token
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

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Mock Google login
    setTimeout(() => {
      localStorage.setItem("adnflix_auth_token", "mock_google_jwt_token");
      
      window.dispatchEvent(new CustomEvent("adnflix_toast", { 
        detail: { message: "Google Authentication Successful" } 
      }));
      navigate("/dashboard");
    }, 1000);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("adnflix_toast", { 
      detail: { message: "Reset instructions sent to your email" } 
    }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-bg-main py-20 px-4">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-pulse delay-700" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-text-main/40 hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Return to Cinema</span>
        </Link>

        {/* Login Card */}
        <div className="skeuo-card overflow-hidden border-primary/10 bg-card-bg/40 backdrop-blur-xl">
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6 shadow-skeuo-sm">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Welcome Back</h1>
              <p className="text-text-main/40 text-xs font-bold uppercase tracking-widest">
                Access your <span className="text-primary italic">ADNFLIX</span> DNA
              </p>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-bg-main border border-text-main/10 hover:border-primary/40 hover:shadow-skeuo-sm transition-all group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Chrome className="w-4 h-4 text-text-main/60 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Google</span>
              </button>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-bg-main border border-text-main/10 hover:border-primary/40 hover:shadow-skeuo-sm transition-all group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Github className="w-4 h-4 text-text-main/60 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Github</span>
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-text-main/5"></div>
              </div>
              <div className="relative flex justify-center text-center">
                <span className="bg-transparent px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-text-main/20">
                  Or use security code
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-main/40 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-bg-main/50 border border-text-main/10 rounded-xl py-4 pl-12 pr-4 text-sm outline-none focus:border-primary/40 focus:bg-bg-main transition-all placeholder:text-text-main/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-main/40">
                    Security Code
                  </label>
                  <button 
                    onClick={handleForgotPassword}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-bg-main/50 border border-text-main/10 rounded-xl py-4 pl-12 pr-12 text-sm outline-none focus:border-primary/40 focus:bg-bg-main transition-all placeholder:text-text-main/20"
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

              {/* Remember Me */}
              <div className="flex items-center gap-3 ml-1">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    "w-5 h-5 rounded-md border transition-all flex items-center justify-center cursor-pointer",
                    rememberMe 
                      ? "bg-primary border-primary shadow-[0_0_10px_rgba(229,9,20,0.3)]" 
                      : "bg-bg-main border-text-main/10"
                  )}
                >
                  {rememberMe && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-main/40">
                  Stay synced for 30 days
                </span>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl bg-primary/10 border border-primary/20"
                  >
                    <p className="text-[10px] font-bold text-primary uppercase text-center leading-relaxed">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Initialize Session
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center mt-10 text-[10px] font-bold uppercase tracking-widest text-text-main/30">
              New to the ecosystem?{" "}
              <a href="#" className="text-primary hover:underline">Create Account</a>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-8 text-center text-[10px] font-mono tracking-widest text-text-main/15">
          SECURE PROTOCOL v4.2.1 • ADNFLIX ENCRYPTION ACTIVE
        </p>
      </motion.div>
    </div>
  );
}

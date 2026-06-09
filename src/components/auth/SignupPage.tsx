/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clearUserSession, decodeJwtPayload } from "@/src/lib/authSession";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
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
        throw new Error(data.error || data.message || "Signup failed");
      }

      if (data.token) {
        clearUserSession();
        localStorage.setItem("adnflix_auth_token", data.token);
        localStorage.setItem(
          "adnflix_user_id",
          String(data.id ?? data.userId ?? ""),
        );
        localStorage.setItem("adnflix_user_name", data.name || name);
        console.info("[AUTH] signup", {
          userId: data.id ?? data.userId ?? null,
          jwtPayload: decodeJwtPayload(data.token),
          requestUrl: "/api/auth/signup",
          responseData: data,
        });
      }

      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: {
            message: "Signup Successful",
            movieTitle: "Welcome to ADNFLIX",
          },
        }),
      );
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12"
      >
        <h1 className="text-3xl font-black text-center mb-8 uppercase text-white">
          Neural Registration
        </h1>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50"
            />
          </div>

          {error && <p className="text-primary text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Register"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-text-main/40 text-xs">
          Already a member?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

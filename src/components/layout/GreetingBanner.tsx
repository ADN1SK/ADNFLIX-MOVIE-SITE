import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function GreetingBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [greeting, setGreeting] = useState("");
  const location = useLocation();

  useEffect(() => {
    // Only run this logic on initial mount or when login status might have changed
    const isNewUser = sessionStorage.getItem("adnflix_is_new_user") === "true";
    const isFirstLoginToday = sessionStorage.getItem("adnflix_is_first_login_today") === "true";
    const alreadyShown = sessionStorage.getItem("adnflix_greeting_shown") === "true";
    
    // Check both session and local storage for name
    const name = sessionStorage.getItem("adnflix_user_name") || localStorage.getItem("adnflix_user_name") || "Member";
    const isLoggedIn = !!localStorage.getItem("adnflix_auth_token");

    // Show if:
    // 1. It's a new user or first login today (from session flags)
    // 2. OR it's a returning logged-in user and we haven't shown it in this session yet
    if (isLoggedIn && !alreadyShown) {
      const hour = new Date().getHours();
      let salutation = "";
      if (hour >= 5 && hour < 12) salutation = "Good morning";
      else if (hour >= 12 && hour < 17) salutation = "Good afternoon";
      else if (hour >= 17 && hour < 21) salutation = "Good evening";
      else salutation = "Good night";

      const firstName = name.trim().split(' ')[0] || "Member";

      if (isNewUser) {
        setGreeting(`Welcome to ADNFLIX, ${firstName}! 🎬 Your cinematic journey starts now.`);
      } else {
        setGreeting(`${salutation}, ${firstName}! 👋 Great to have you back. Ready to discover something new?`);
      }

      setIsVisible(true);
      sessionStorage.setItem("adnflix_greeting_shown", "true");
    }
  }, [location.pathname]); // Keep location.pathname to trigger after login redirect

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000); // Increased to 8 seconds for better readability
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-24 left-0 right-0 z-[999] px-4 md:px-8 pointer-events-none"
        >
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl pointer-events-auto">
            {/* Animated primary red glow on the left edge */}
            <motion.div 
              animate={{ 
                opacity: [0.5, 1, 0.5],
                boxShadow: [
                  "0 0 10px rgba(229,9,20,0.3)",
                  "0 0 25px rgba(229,9,20,0.7)",
                  "0 0 10px rgba(229,9,20,0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" 
            />
            
            <div className="flex items-center justify-between p-4 md:p-6 ml-1.5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <span className="text-primary text-lg">✨</span>
                </div>
                <p className="text-sm md:text-base font-bold text-white tracking-tight leading-snug">
                  {greeting}
                </p>
              </div>
              
              <button
                onClick={() => setIsVisible(false)}
                className="ml-6 rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

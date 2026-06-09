import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

export default function WelcomeOverlay({ username, onComplete }: { username: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000); // Show for 3 seconds
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#050505] backdrop-blur-md"
    >
      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl md:text-6xl font-black text-white uppercase text-center"
      >
        Welcome, <span className="text-primary">{username}</span>
      </motion.h1>
    </motion.div>
  );
}

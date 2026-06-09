import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function WelcomeMessage({ name }: { name: string }) {
  const [show, setShow] = useState(true);
  const [greeting] = useState(() => {
    const greetings = ["Hello", "Welcome back", "Hi there", "Good to see you"];
    return greetings[Math.floor(Math.random() * greetings.length)];
  });

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-lg"
        >
          <p className="text-primary font-bold text-sm tracking-widest uppercase">
            {greeting}, {name}!
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

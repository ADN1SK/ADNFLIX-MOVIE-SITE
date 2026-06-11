import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/src/lib/ThemeContext";

interface Option {
  id: string | number;
  name: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  className?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  label,
  className,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const selectedOption = options.find((opt) => opt.id.toString() === value.toString());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/30 mb-2 ml-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 text-left",
          "shadow-skeuo-sm active:translate-y-0.5",
          theme === "dark" 
            ? "bg-card-bg/80 border-white/5 hover:border-primary/30" 
            : "bg-white/80 border-black/5 hover:border-primary/30",
          isOpen && "border-primary/50 ring-2 ring-primary/10 shadow-skeuo-md"
        )}
      >
        <span className="text-sm font-bold tracking-tight text-text-main/80 truncate">
          {selectedOption ? selectedOption.name : "Select option"}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-primary transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className={cn(
              "absolute z-[200] w-full mt-3 py-2 rounded-2xl border shadow-2xl backdrop-blur-3xl max-h-[300px] overflow-y-auto custom-scrollbar",
              theme === "dark" ? "bg-card-bg/95 border-white/10" : "bg-white/95 border-black/10"
            )}
          >
            <div className="px-2 space-y-1">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group",
                    value.toString() === option.id.toString()
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "hover:bg-primary/10 text-text-main/70 hover:text-primary"
                  )}
                >
                  <span className="text-sm font-bold tracking-tight">
                    {option.name}
                  </span>
                  {value.toString() === option.id.toString() && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

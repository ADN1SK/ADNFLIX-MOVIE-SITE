import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, AlertCircle, Check, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface DeleteButtonProps {
  onDelete: () => void;
  label?: string;
  className?: string;
  confirmMessage?: string;
}

export default function DeleteButton({
  onDelete,
  label = "Delete",
  className,
  confirmMessage = "Are you sure?",
}: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleInitialClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(false);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
    setIsConfirming(false);
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <AnimatePresence mode="wait">
        {!isConfirming ? (
          <motion.button
            key="delete-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleInitialClick}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-main/30 hover:text-red-500 transition-all duration-300 group cursor-pointer"
          >
            <Trash2 className="w-3 h-3 group-hover:rotate-12 transition-transform" />
            {label}
          </motion.button>
        ) : (
          <motion.div
            key="confirm-state"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1.5 shadow-lg shadow-red-500/5"
          >
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-black uppercase tracking-tight text-red-500/80">
              {confirmMessage}
            </span>
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={handleConfirm}
                className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                title="Confirm Delete"
              >
                <Check className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded-full bg-white/10 text-text-main/50 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                title="Cancel"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Palette, Bell, Sliders, Save, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/lib/ThemeContext";

const ACCENT_COLORS = [
  { id: "red", name: "Crimson Red", value: "#e50914" },
  { id: "purple", name: "Purple", value: "#800080" },
  { id: "pink", name: "Pink", value: "#FFC0CB" },
  { id: "blue", name: "Blue", value: "#0000FF" },
  { id: "emerald", name: "Green", value: "#008000" },
  { id: "gold", name: "Gold", value: "#FFD700" },
];

export default function PreferencesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  
  // State for settings
  const [activeTab, setActiveTab] = useState<"ui" | "notifications">("ui");
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0].value);
  const [uiScale, setUiScale] = useState("100");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reviewReplies, setReviewReplies] = useState(true);

  // Load preferences from local storage on mount
  useEffect(() => {
    const savedColor = localStorage.getItem("adnflix_accent_color");
    if (savedColor) setAccentColor(savedColor);

    const savedScale = localStorage.getItem("adnflix_ui_scale");
    if (savedScale) setUiScale(savedScale);

    const savedAlerts = localStorage.getItem("adnflix_email_alerts");
    if (savedAlerts !== null) setEmailAlerts(savedAlerts === "true");

    const savedReplies = localStorage.getItem("adnflix_review_replies");
    if (savedReplies !== null) setReviewReplies(savedReplies === "true");
  }, []);

  // Apply accent color and scale immediately for live preview
  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiScale}%`;
  }, [uiScale]);

  const handleSave = () => {
    localStorage.setItem("adnflix_accent_color", accentColor);
    localStorage.setItem("adnflix_ui_scale", uiScale);
    localStorage.setItem("adnflix_email_alerts", String(emailAlerts));
    localStorage.setItem("adnflix_review_replies", String(reviewReplies));
    
    window.dispatchEvent(
      new CustomEvent("adnflix_toast", {
        detail: {
          message: "Your preferences have been saved.",
          movieTitle: "Settings Updated",
        },
      }),
    );
    onClose();
  };

  const handleCancel = () => {
    // Revert to saved or default values if canceled
    const savedColor = localStorage.getItem("adnflix_accent_color") || ACCENT_COLORS[0].value;
    document.documentElement.style.setProperty("--color-primary", savedColor);
    setAccentColor(savedColor);

    const savedScale = localStorage.getItem("adnflix_ui_scale") || "100";
    document.documentElement.style.fontSize = `${savedScale}%`;
    setUiScale(savedScale);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden",
            theme === "dark"
              ? "bg-card-bg/95 border-white/10"
              : "bg-white/95 border-black/10"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-text-main/10">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Preferences
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 rounded-full hover:bg-text-main/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-text-main/60" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row h-[400px]">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-text-main/10 p-4 space-y-2 bg-black/5">
              <button
                onClick={() => setActiveTab("ui")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-tight cursor-pointer",
                  activeTab === "ui"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-text-main/60 hover:bg-text-main/5 hover:text-text-main"
                )}
              >
                <Palette className="w-4 h-4" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-tight cursor-pointer",
                  activeTab === "notifications"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-text-main/60 hover:bg-text-main/5 hover:text-text-main"
                )}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
            </div>

            {/* Content Area */}
            <div className="w-full md:w-2/3 p-6 overflow-y-auto custom-scrollbar">
              {activeTab === "ui" && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  {/* Accent Color Selection */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 mb-4">
                      Accent Color
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setAccentColor(color.value)}
                          className={cn(
                            "relative aspect-square rounded-full transition-transform hover:scale-110 cursor-pointer",
                            accentColor === color.value ? "ring-2 ring-offset-2 ring-offset-bg-main" : ""
                          )}
                          style={{
                            backgroundColor: color.value,
                            boxShadow: accentColor === color.value ? `0 0 15px ${color.value}80` : "none",
                          }}
                        >
                          {accentColor === color.value && (
                            <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UI Scaling */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 mb-4">
                      Interface Scale
                    </label>
                    <div className="space-y-4">
                      <input
                        type="range"
                        min="90"
                        max="110"
                        step="5"
                        value={uiScale}
                        onChange={(e) => setUiScale(e.target.value)}
                        className="w-full accent-primary bg-text-main/10 rounded-lg appearance-none h-2 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs font-bold text-text-main/50">
                        <span>Small (90%)</span>
                        <span className="text-primary">{uiScale}%</span>
                        <span>Large (110%)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 mb-4">
                      Email Preferences
                    </label>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-text-main/5 bg-text-main/5">
                        <div className="pr-4">
                          <p className="text-sm font-bold text-text-main">New Movie Releases</p>
                          <p className="text-xs text-text-main/50 mt-1">Get notified when movies matching your DNA drop.</p>
                        </div>
                        <button
                          onClick={() => setEmailAlerts(!emailAlerts)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0",
                            emailAlerts ? "bg-primary" : "bg-text-main/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              emailAlerts ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl border border-text-main/5 bg-text-main/5">
                        <div className="pr-4">
                          <p className="text-sm font-bold text-text-main">Review Interactions</p>
                          <p className="text-xs text-text-main/50 mt-1">Emails when someone replies to your movie reviews.</p>
                        </div>
                        <button
                          onClick={() => setReviewReplies(!reviewReplies)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0",
                            reviewReplies ? "bg-primary" : "bg-text-main/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              reviewReplies ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-text-main/10 bg-black/5">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-text-main/60 hover:text-text-main transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

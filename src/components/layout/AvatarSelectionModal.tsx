import React, { useState } from "react";
import { X, Upload, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { getAuthToken } from "@/src/lib/authSession";

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (avatarUrl: string) => void;
}

const PRESET_AVATARS = [
  "/avatars/darth-vader.jpg",
  "/avatars/film-buff.png",
  "/avatars/perry.jpeg",
  "/avatars/vampire-raph.jpeg",
  "/avatars/penguin-suit.jpeg",
  "/avatars/vincent-roche.jpeg",
];

export default function AvatarSelectionModal({ isOpen, onClose, onUpdate }: AvatarSelectionModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      window.dispatchEvent(new CustomEvent("adnflix_toast", { detail: { message: "Invalid file type. Please upload JPG, PNG, or WebP." } }));
      return;
    }

    setUploadedFile(file);
    setSelectedAvatar(""); // Clear preset selection
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedAvatar && !uploadedFile) return;

    const token = getAuthToken();
    setIsSaving(true);
    try {
      let avatarUrl = selectedAvatar;
      
      // If a file was uploaded, upload it to the server first
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("avatar", uploadedFile);

        const uploadRes = await fetch("http://localhost:5000/api/auth/upload-avatar", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          console.error("Avatar upload failed:", errorData);
          throw new Error(errorData.details || errorData.message || errorData.error || "Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.avatar_url;
      }

      // Fetch current profile first to get the user's name
      const profileRes = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await profileRes.json();

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: profile.name,
          avatar_url: avatarUrl 
        }),
      });

      if (response.ok) {
        onUpdate(avatarUrl);
        onClose();
        window.dispatchEvent(new Event("adnflix_sync"));
        window.dispatchEvent(new CustomEvent("adnflix_toast", { detail: { message: "Avatar updated successfully!" } }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Failed to update profile`);
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent("adnflix_toast", { detail: { message: err instanceof Error ? err.message : "Error updating avatar" } }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm z-[150]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-4"
          >
            <div className="bg-card-bg border border-text-main/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Choose Your Avatar</h3>
                <button onClick={onClose} className="p-2 hover:bg-text-main/5 rounded-full cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {PRESET_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      setUploadedFile(null);
                      setPreviewUrl(null);
                    }}
                    className={cn(
                      "w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
                      selectedAvatar === avatar ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                
                {/* Uploaded Preview */}
                {previewUrl && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary">
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-text-main/5 hover:bg-text-main/10 transition-colors font-bold text-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload Photo
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || (!selectedAvatar && !uploadedFile)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors font-bold text-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

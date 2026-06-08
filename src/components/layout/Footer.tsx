/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { Github, Twitter, Instagram, Mail, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToTop = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  return (
    <footer className="relative border-t border-white/5 bg-black/20 backdrop-blur-sm py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-16">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1 space-y-6">
            <button 
              onClick={scrollToTop}
              className="text-3xl font-bold tracking-tighter hover:opacity-80 transition-opacity cursor-pointer text-left"
            >
              ADN<span className="text-primary italic">FLIX</span>
            </button>
            <p className="text-text-main/40 text-sm max-w-sm leading-relaxed">
              The ultimate cinematic experience tailored to your DNA. 
              Streaming the world's greatest stories with precision delivery 
              and unparalleled quality. Join the evolution of film.
            </p>
          </div>

          {/* Content Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/20">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-text-main/60 font-medium">
              <li>
                <button 
                  onClick={scrollToTop}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <RouterLink to="/trending" className="hover:text-primary transition-colors">Trending</RouterLink>
              </li>
              <li>
                <RouterLink to="/popular" className="hover:text-primary transition-colors">Popular Hits</RouterLink>
              </li>
              <li>
                <RouterLink to="/about" className="hover:text-primary transition-colors">About Us</RouterLink>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/20">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-text-main/60 font-medium">
              <li>
                <RouterLink to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</RouterLink>
              </li>
              <li>
                <RouterLink to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</RouterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            {[
              { 
                Icon: Twitter, 
                href: "https://x.com/ADN1SK_DEV", 
                label: "X (Twitter)",
                hoverClass: "hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/5"
              },
              { 
                Icon: Linkedin, 
                href: "https://linkedin.com/in/adan-mohamedd", 
                label: "LinkedIn",
                hoverClass: "hover:text-[#0A66C2] hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/5"
              },
              { 
                Icon: Github, 
                href: "https://github.com/ADN1SK", 
                label: "GitHub",
                hoverClass: "hover:text-white hover:border-white/50 hover:bg-white/5"
              },
              { 
                Icon: Instagram, 
                href: "https://instagram.com/adam_m_yasin", 
                label: "Instagram",
                hoverClass: "hover:text-[#E4405F] hover:border-[#E4405F]/50 hover:bg-[#E4405F]/5"
              },
              { 
                Icon: Mail, 
                href: "mailto:adammoha0987@gmail.com", 
                label: "Email",
                hoverClass: "hover:text-primary hover:border-primary/50 hover:bg-primary/5"
              },
            ].map(({ Icon, href, hoverClass }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-text-main/30 hover:scale-110 transition-all duration-300 ${hoverClass}`}
                title={href.includes('mailto') ? 'Email' : undefined}
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
          
          <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest text-text-main/20 uppercase">
            <span>© {currentYear} ADNFLIX STUDIOS</span>
            <span className="hidden md:inline">•</span>
            <span>POWERED BY ADN1SK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

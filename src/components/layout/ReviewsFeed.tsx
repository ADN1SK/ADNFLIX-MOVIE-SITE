import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Star,
  User,
  Film,
  Search,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAuthToken } from "@/src/lib/authSession";
import { cn, buildCommentTree, addCommentToTree } from "@/src/lib/utils";
import { Review, Comment } from "@/src/types";
import CommentSection from "./CommentSection";

export default function ReviewsFeed() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const token = getAuthToken();

  const fetchReviews = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/reviews");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data: Review[] = await res.json();

      // Fetch comments for all reviews in parallel
      const reviewsWithComments = await Promise.all(
        data.map(async (review) => {
          try {
            const commentsRes = await fetch(
              `http://127.0.0.1:5000/api/reviews/${review.id}/comments`
            );
            const commentsData: Comment[] = commentsRes.ok ? await commentsRes.json() : [];
            
            return {
              ...review,
              comments: buildCommentTree(commentsData),
              isCommentsExpanded: false,
              totalCommentCount: commentsData.length
            };
          } catch {
            return { ...review, comments: [], isCommentsExpanded: false, totalCommentCount: 0 };
          }
        })
      );

      setReviews(reviewsWithComments);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const toggleComments = (reviewId: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, isCommentsExpanded: !r.isCommentsExpanded } : r
      )
    );
  };

  const onCommentAdded = (reviewId: number, newComment: Comment) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            comments: addCommentToTree(r.comments || [], newComment),
            isCommentsExpanded: true,
            totalCommentCount: (r.totalCommentCount || 0) + 1
          };
        }
        return r;
      })
    );
  };

  const filteredReviews = reviews.filter((r) =>
    r.movie_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.review_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-main px-4 pt-28 pb-16 md:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Header Section */}
        <header className="mb-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5 mb-3">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              ADNFLIX DISCOURSE
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-text-main to-text-main/40">
            Cinema Feed
          </h1>
          <p className="text-sm md:text-base text-text-main/55 max-w-2xl leading-relaxed">
            Read reviews, check out ratings, and join the conversation. Engagement with film is a shared experience.
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-main/30" />
          <input
            type="text"
            placeholder="Search reviews, users, or movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50 transition-all shadow-inner placeholder:text-text-main/20"
          />
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-48 rounded-3xl border border-white/5 bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <motion.article
                layout
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-text-main/10 bg-card-bg/60 p-6 md:p-8 shadow-skeuo-sm relative overflow-hidden transition-all duration-300 hover:border-text-main/20 group"
              >
                {/* Background decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />
                
                {/* Header: User, Date and Rating */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-text-main/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">
                        {review.user_name || "Anonymous Movie Buff"}
                      </p>
                      <p className="text-[10px] text-text-main/30 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-3 h-3",
                            star <= review.rating
                              ? "fill-primary text-primary"
                              : "text-text-main/10"
                          )}
                        />
                      ))}
                      <span className="ml-1.5 text-xs font-black text-primary">
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Movie Link and Review Text */}
                <div className="mb-6">
                  <Link
                    to={`/movies/${review.tmdb_movie_id}`}
                    className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline mb-2 transition-all cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    {review.movie_title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                  <p className="text-text-main/70 text-sm leading-relaxed whitespace-pre-wrap pl-1">
                    "{review.review_text}"
                  </p>
                </div>

                {/* Footer Controls: Comments Toggle */}
                <div className="flex items-center justify-between border-t border-text-main/5 pt-4">
                  <button
                    onClick={() => toggleComments(review.id)}
                    className="flex items-center gap-2 text-xs font-bold text-text-main/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>
                      {review.totalCommentCount || 0}{" "}
                      {review.totalCommentCount === 1 ? "Comment" : "Comments"}
                    </span>
                    {review.isCommentsExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Comments Expandable Drawer */}
                <AnimatePresence>
                  {review.isCommentsExpanded && (
                    <CommentSection 
                      reviewId={review.id} 
                      comments={review.comments || []} 
                      onCommentAdded={(newComment) => onCommentAdded(review.id, newComment)} 
                    />
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-text-main/10 bg-card-bg/20 text-center">
            <MessageSquare className="w-12 h-12 text-primary/40 mb-4" />
            <h3 className="text-xl font-bold mb-2">No reviews found</h3>
            <p className="text-sm text-text-main/40 max-w-xs leading-relaxed">
              We couldn't find any reviews matching your search. Be the first to post a review on your favorite movie!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

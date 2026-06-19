import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Reply,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "@/src/lib/authSession";
import { cn } from "@/src/lib/utils";
import { Comment } from "@/src/types";

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReply: (parentId: number, userName: string) => void;
  token: string | null;
}

function CommentItem({
  comment,
  depth = 0,
  onReply,
  token,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className={cn("flex flex-col gap-2", depth > 0 && "ml-4 md:ml-8 mt-2")}>
      <div className="group relative">
        {depth > 0 && (
          <div className="absolute -left-4 md:-left-6 top-0 bottom-0 w-px bg-text-main/10 group-hover:bg-primary/30 transition-colors" />
        )}
        
        <div className="bg-card-bg/30 border border-text-main/5 rounded-2xl p-4 transition-all hover:border-text-main/10 hover:bg-card-bg/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="w-3 h-3 text-primary" />
              </div>
              <span className="text-xs font-bold text-white/95">
                {comment.user_name || "Anonymous"}
              </span>
            </div>
            <span className="text-[9px] font-bold text-text-main/30 uppercase">
              {new Date(comment.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          
          <p className="text-xs text-text-main/70 leading-relaxed mb-3">
            {comment.comment_text}
          </p>
          
          <div className="flex items-center gap-4">
            {token && (
              <button
                onClick={() => onReply(comment.id, comment.user_name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-black text-primary uppercase tracking-wider hover:bg-primary/20 transition-all cursor-pointer"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-text-main/40 uppercase tracking-wider hover:bg-white/10 hover:text-text-main/70 transition-all cursor-pointer"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide {comment.replies.length}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show {comment.replies.length}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="flex flex-col gap-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              token={token}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentSectionProps {
  reviewId: number;
  comments: Comment[];
  onCommentAdded: (newComment: Comment) => void;
}

export default function CommentSection({
  reviewId,
  comments,
  onCommentAdded,
}: CommentSectionProps) {
  const [commentInput, setCommentInput] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ id: number; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const token = getAuthToken();

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!commentInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/reviews/${reviewId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment_text: commentInput.trim(),
            parent_id: replyTarget?.id || null,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to add comment");
      const newComment: Comment = await res.json();
      newComment.replies = [];

      onCommentAdded(newComment);
      setCommentInput("");
      setReplyTarget(null);

      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "Comment posted successfully!" },
        })
      );
    } catch (err) {
      console.error(err);
      window.dispatchEvent(
        new CustomEvent("adnflix_toast", {
          detail: { message: "Error posting comment. Try again." },
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (parentId: number, userName: string) => {
    setReplyTarget({ id: parentId, name: userName });
    const input = document.getElementById(`comment-input-${reviewId}`);
    if (input) input.focus();
  };

  return (
    <div className="overflow-hidden mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4 shadow-inner">
      <div className="space-y-6 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              token={token}
              onReply={handleReply}
            />
          ))
        ) : (
          <p className="text-xs text-text-main/35 italic py-2 pl-1">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-text-main/5">
        <AnimatePresence>
          {replyTarget && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 mb-3"
            >
              <div className="flex items-center gap-2">
                <CornerDownRight className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-text-main/50 font-bold uppercase tracking-tight">
                  Replying to <span className="text-primary">{replyTarget.name}</span>
                </span>
              </div>
              <button
                onClick={() => setReplyTarget(null)}
                className="text-[10px] font-black text-text-main/30 hover:text-red-500 bg-white/5 px-2 py-1 rounded-md transition-all uppercase tracking-tighter"
              >
                CANCEL
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
          <input
            id={`comment-input-${reviewId}`}
            type="text"
            placeholder={
              token
                ? replyTarget
                  ? "Write a reply..."
                  : "Add a comment..."
                : "Log in to join the conversation"
            }
            disabled={!token}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="flex-1 bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-primary/50 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!token || !commentInput.trim() || isSubmitting}
            className="p-2.5 rounded-xl bg-primary text-white hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-30 transition-all cursor-pointer shadow-lg shadow-primary/20"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

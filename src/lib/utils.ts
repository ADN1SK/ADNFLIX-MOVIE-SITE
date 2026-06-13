import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Builds a recursive tree structure from a flat list of comments
 */
export function buildCommentTree(comments: any[], parentId: number | null = null): any[] {
  return comments
    .filter((c) => c.parent_id === parentId)
    .map((c) => ({
      ...c,
      replies: buildCommentTree(comments, c.id),
    }));
}

/**
 * Recursively adds a new comment to an existing tree of comments
 */
export function addCommentToTree(nodes: any[], newComment: any): any[] {
  if (newComment.parent_id === null) return [...nodes, newComment];
  return nodes.map((node) => {
    if (node.id === newComment.parent_id) {
      return { ...node, replies: [...(node.replies || []), newComment] };
    } else if (node.replies && node.replies.length > 0) {
      return { ...node, replies: addCommentToTree(node.replies, newComment) };
    }
    return node;
  });
}

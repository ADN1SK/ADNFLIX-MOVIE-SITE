export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: string;
  popularity?: number;
  runtime?: number;
  number_of_seasons?: number;
  revenue?: number;
  budget?: number;
  tagline?: string;
  homepage?: string | null;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Comment {
  id: number;
  review_id: number;
  user_id: number;
  user_name: string;
  comment_text: string;
  parent_id: number | null;
  created_at: string;
  replies?: Comment[];
}

export interface Review {
  id: number;
  user_id: number;
  user_name: string;
  tmdb_movie_id: number;
  movie_title: string;
  rating: number;
  review_text: string;
  created_at: string;
  comments?: Comment[];
  isCommentsExpanded?: boolean;
  totalCommentCount?: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  watchlist: number[];
  favorites: number[];
  tier: "Basic" | "Premium";
}

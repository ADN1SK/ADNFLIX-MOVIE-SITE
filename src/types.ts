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

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  watchlist: number[];
  favorites: number[];
  tier: "Basic" | "Premium";
}

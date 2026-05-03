/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CastOverlay from "./CastOverlay";

export default function CastPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<any>(null);
  const [cast, setCast] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/movies/movie/${id}`)
      .then((r) => r.json())
      .then(setMovie);
    fetch(`/api/movies/movie/${id}/credits`)
      .then((r) => r.json())
      .then((d) => setCast(d.cast || []));
    window.scrollTo(0, 0);
  }, [id]);

  if (!movie) return null;

  return (
    <CastOverlay
      isOpen={true}
      onClose={() => navigate(-1)}
      cast={cast}
      movieTitle={movie.title}
      onPersonClick={(personId) => navigate(`/person/${personId}`)}
    />
  );
}

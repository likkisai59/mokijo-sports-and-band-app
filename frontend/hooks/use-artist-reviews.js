"use client";

import { useReviews } from "./use-reviews";

export function useArtistReviews() {
  return useReviews("artist");
}

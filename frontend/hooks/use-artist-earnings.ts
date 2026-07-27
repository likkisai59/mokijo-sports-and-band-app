"use client";

import { useEarnings } from "./use-earnings";

export function useArtistEarnings() {
  return useEarnings("artist");
}

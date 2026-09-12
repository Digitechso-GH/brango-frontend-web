"use client";

import { useQuery } from "@tanstack/react-query";
import { routesApi } from "../api/routes.api";
import { SuggestedRoute } from "../types/suggested-routes.schemas";

export function useSuggestedRoutesQuery(date?: string) {
  return useQuery<SuggestedRoute[]>({
    queryKey: ["suggested-routes", date],
    queryFn: () => routesApi.getSuggestedRoutes(date),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

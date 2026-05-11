import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SiteSettings, UpdateSiteSettings } from "@shared/schema";

export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
}

export function useUpdateSiteSettings() {
  return useMutation({
    mutationFn: (data: UpdateSiteSettings) =>
      apiRequest("PUT", "/api/settings", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });
}

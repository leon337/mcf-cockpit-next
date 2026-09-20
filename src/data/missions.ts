import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const MissionLabelSchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    color: z.string().nullable().optional(),
    description: z.string().nullable().optional()
  })
]);

export const MissionSchema = z.object({
  id: z.number(),
  number: z.number(),
  code: z.string().nullable(),
  title: z.string(),
  url: z.string().url(),
  state: z.enum(["open", "closed"]),
  stateReason: z.string().nullable().optional(),
  labels: z.array(MissionLabelSchema),
  author: z.string().nullable().optional(),
  comments: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().nullable().optional()
});

export const MissionsResponseSchema = z.object({
  ok: z.literal(true),
  generatedAt: z.string(),
  source: z.string(),
  cache: z.string().optional(),
  selection: z.object({
    repository: z.string(),
    rule: z.string(),
    window: z.string(),
    pullRequestsExcluded: z.boolean()
  }),
  counts: z.object({
    total: z.number(),
    open: z.number(),
    closed: z.number()
  }),
  missions: z.array(MissionSchema)
});

export type Mission = z.infer<typeof MissionSchema>;
export type MissionsResponse = z.infer<typeof MissionsResponseSchema>;

export async function fetchMissions() {
  const response = await fetch("/api/missions", {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json();
  if (!response.ok || payload?.ok !== true) {
    throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
  }
  return MissionsResponseSchema.parse(payload);
}

export function useMissions() {
  return useQuery({
    queryKey: ["mcf-missions"],
    queryFn: fetchMissions,
    staleTime: 5 * 60 * 1000
  });
}

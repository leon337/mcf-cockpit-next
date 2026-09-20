import { z } from "zod";

export const RepositorySchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  fullName: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  defaultBranch: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  stars: z.number().nullable().optional(),
  forks: z.number().nullable().optional(),
  openIssues: z.number().nullable().optional(),
  archived: z.boolean().nullable().optional(),
  visibility: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  pushedAt: z.string().nullable().optional()
});

export const RegistrySchema = z.object({
  status: z.string(),
  lifecycle: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  capsulePath: z.string().nullable().optional(),
  entrypoints: z.array(z.string()).default([]),
  operationalState: z.string().nullable().optional(),
  projectIdentity: z.string().nullable().optional()
});

export const EcosystemNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  repository: RepositorySchema.nullable().optional(),
  canonicalRepository: z.string().nullable().optional(),
  registry: RegistrySchema,
  classification: z.object({
    group: z.string(),
    relationLabel: z.string().nullable().optional(),
    sourceType: z.string().nullable().optional(),
    canonicalRelation: z.boolean().nullable().optional()
  }),
  evidence: z.array(z.string()).default([])
});

export const EcosystemGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  relationLabel: z.string(),
  sourceType: z.string(),
  nodes: z.array(EcosystemNodeSchema)
});

export const EcosystemResponseSchema = z.object({
  ok: z.literal(true),
  generatedAt: z.string(),
  sources: z.object({
    registry: z.string(),
    currentState: z.string(),
    github: z.string()
  }),
  authority: z.object({
    id: z.string(),
    label: z.string(),
    role: z.string(),
    source: z.string().optional()
  }),
  core: EcosystemNodeSchema.nullable(),
  groups: z.array(EcosystemGroupSchema),
  inventory: z.array(EcosystemNodeSchema),
  counts: z.object({
    registryProjects: z.number(),
    representedRegisteredProjects: z.number(),
    discoveredUnregistered: z.number(),
    referencedNotRegistered: z.number().optional().default(0),
    totalNodes: z.number()
  }),
  structuralRecoveryCore: z.array(z.string()),
  provenance: z.object({
    registryRoot: z.string(),
    currentStatePath: z.string(),
    note: z.string()
  })
});

export const AccountResponseSchema = z.object({
  ok: z.literal(true),
  generatedAt: z.string(),
  source: z.string(),
  account: z.object({
    login: z.string(),
    name: z.string().nullable().optional(),
    avatar: z.string().url(),
    url: z.string().url(),
    bio: z.string().nullable().optional(),
    publicRepos: z.number(),
    followers: z.number(),
    following: z.number(),
    createdAt: z.string(),
    updatedAt: z.string()
  })
});

export type EcosystemNode = z.infer<typeof EcosystemNodeSchema>;
export type EcosystemGroup = z.infer<typeof EcosystemGroupSchema>;
export type EcosystemResponse = z.infer<typeof EcosystemResponseSchema>;
export type AccountResponse = z.infer<typeof AccountResponseSchema>;

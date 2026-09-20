import { AccountResponseSchema, EcosystemResponseSchema } from "@/data/schema";

async function getJson(path: string) {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok || payload?.ok !== true) {
    throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
  }
  return payload;
}

export async function fetchAccount() {
  return AccountResponseSchema.parse(await getJson("/api/github"));
}

export async function fetchEcosystem() {
  return EcosystemResponseSchema.parse(await getJson("/api/ecosystem"));
}

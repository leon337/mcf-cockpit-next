import { useQuery } from "@tanstack/react-query";
import { fetchAccount, fetchEcosystem } from "@/data/api";

export function useAccount() {
  return useQuery({ queryKey: ["github-account"], queryFn: fetchAccount });
}

export function useEcosystem() {
  return useQuery({ queryKey: ["mcf-ecosystem"], queryFn: fetchEcosystem });
}

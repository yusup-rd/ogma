"use client";

import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { createQueryClient } from "@/lib/queries/query-client";

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [client] = useState(createQueryClient);
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `ogma-time-zone=${encodeURIComponent(timeZone)}; Path=/; SameSite=Lax; Max-Age=31536000${location.protocol === "https:" ? "; Secure" : ""}`;
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export const ClearSessionQueries = () => {
  const client = useQueryClient();
  useEffect(() => {
    client.clear();
  }, [client]);
  return null;
};

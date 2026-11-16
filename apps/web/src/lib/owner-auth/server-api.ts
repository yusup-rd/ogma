import { headers } from "next/headers";

export async function fetchOwnerApi(path: string) {
  const apiOrigin = process.env.API_ORIGIN ?? "http://127.0.0.1:3001";
  const requestHeaders = await headers();
  return fetch(new URL(path, apiOrigin), {
    cache: "no-store",
    headers: { cookie: requestHeaders.get("cookie") ?? "" },
    signal: AbortSignal.timeout(5000),
  });
}

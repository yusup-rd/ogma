import { QueryCache, QueryClient } from "@tanstack/react-query";

export function requestStatus(error: unknown) {
  return error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : undefined;
}

export function createQueryClient() {
  let redirecting = false;
  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (
          requestStatus(error) !== 401 ||
          typeof window === "undefined" ||
          redirecting
        )
          return;
        redirecting = true;
        void client.cancelQueries().then(() => {
          client.clear();
          window.location.replace("/");
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: typeof window === "undefined" ? Infinity : 10 * 60_000,
        retry: (attempt, error) => {
          const status = requestStatus(error);
          return (
            attempt < 2 &&
            (status === 503 ||
              status === 502 ||
              status === 504 ||
              error instanceof TypeError)
          );
        },
        retryDelay: (attempt) => Math.min(500 * (attempt + 1), 2000),
      },
      mutations: { retry: false },
    },
  });
  return client;
}

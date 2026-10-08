import { QueryClient } from '@tanstack/react-query'

export const dashboardQueryKey = ['dashboard', 'resumen'] as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

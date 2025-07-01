import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { getCurrentSession } from './supabase.js';

export const trpc = createTRPCReact();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL}/trpc`,
      async headers() {
        const session = await getCurrentSession();
        return {
          authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        };
      },
    }),
  ],
});
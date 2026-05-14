import { z } from 'zod';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({
          success: z.boolean(),
          admin: z.object({ id: z.string(), username: z.string(), name: z.string(), email: z.string() }).optional(),
          message: z.string().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: { 200: z.object({ success: z.boolean() }) },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({ id: z.string(), username: z.string(), name: z.string(), email: z.string() }).nullable(),
      },
    },
  },
};

export type LoginInput = z.infer<typeof api.auth.login.input>;
export type LoginResponse = z.infer<typeof api.auth.login.responses[200]>;
export type CurrentUserResponse = z.infer<typeof api.auth.me.responses[200]>;

import { z } from 'zod';
import {
  insertBlogPostSchema,
  insertContactMessageSchema,
  insertMusicTrackSchema,
  insertBrandItemSchema,

  insertResumeItemSchema,
  insertLinkItemSchema,
  linkItemSchema,
  blogPostSchema,
  contactMessageSchema,
  musicTrackSchema,
  brandItemSchema,

  resumeItemSchema,
} from './schema';


export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          admin: z.object({
            id: z.string(),
            username: z.string(),
            name: z.string(),
            email: z.string(),
          }).optional(),
          message: z.string().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({
          id: z.string(),
          username: z.string(),
          name: z.string(),
          email: z.string(),
        }).nullable(),
      },
    },
  },

  blog: {
    list: {
      method: 'GET' as const,
      path: '/api/blog' as const,
      responses: {
        200: z.array(blogPostSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/blog/:slug' as const,
      responses: {
        200: blogPostSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/blog' as const,
      input: insertBlogPostSchema,
      responses: {
        201: blogPostSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/blog/:id' as const,
      input: insertBlogPostSchema.partial(),
      responses: {
        200: blogPostSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/blog/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },

  contact: {
    list: {
      method: 'GET' as const,
      path: '/api/contact' as const,
      responses: {
        200: z.array(contactMessageSchema),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contact' as const,
      input: insertContactMessageSchema,
      responses: {
        201: contactMessageSchema,
        400: errorSchemas.validation,
      },
    },
    markRead: {
      method: 'PATCH' as const,
      path: '/api/contact/:id/read' as const,
      responses: {
        200: contactMessageSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/contact/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },

  music: {
    list: {
      method: 'GET' as const,
      path: '/api/music' as const,
      responses: {
        200: z.array(musicTrackSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/music/:id' as const,
      responses: {
        200: musicTrackSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/music' as const,
      input: insertMusicTrackSchema,
      responses: {
        201: musicTrackSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/music/:id' as const,
      input: insertMusicTrackSchema.partial(),
      responses: {
        200: musicTrackSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/music/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },

  brand: {
    list: {
      method: 'GET' as const,
      path: '/api/brand' as const,
      responses: {
        200: z.array(brandItemSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/brand/:id' as const,
      responses: {
        200: brandItemSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/brand' as const,
      input: insertBrandItemSchema,
      responses: {
        201: brandItemSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/brand/:id' as const,
      input: insertBrandItemSchema.partial(),
      responses: {
        200: brandItemSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/brand/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  links: {
    list: {
      method: 'GET' as const,
      path: '/api/links' as const,
      responses: {
        200: z.array(linkItemSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/links' as const,
      input: insertLinkItemSchema,
      responses: {
        201: linkItemSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/links/:id' as const,
      input: insertLinkItemSchema.partial(),
      responses: {
        200: linkItemSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/links/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  resume: {
    list: {
      method: 'GET' as const,
      path: '/api/resume' as const,
      responses: {
        200: z.array(resumeItemSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/resume/:id' as const,
      responses: {
        200: resumeItemSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/resume' as const,
      input: insertResumeItemSchema,
      responses: {
        201: resumeItemSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/resume/:id' as const,
      input: insertResumeItemSchema.partial(),
      responses: {
        200: resumeItemSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/resume/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type LoginInput = z.infer<typeof api.auth.login.input>;
export type LoginResponse = z.infer<typeof api.auth.login.responses[200]>;
export type CurrentUserResponse = z.infer<typeof api.auth.me.responses[200]>;

export type BlogPostInput = z.infer<typeof api.blog.create.input>;
export type BlogPostUpdateInput = z.infer<typeof api.blog.update.input>;
export type BlogPostResponse = z.infer<typeof api.blog.create.responses[201]>;

export type ContactMessageInput = z.infer<typeof api.contact.create.input>;
export type ContactMessageResponse = z.infer<typeof api.contact.create.responses[201]>;

export type MusicTrackInput = z.infer<typeof api.music.create.input>;
export type MusicTrackUpdateInput = z.infer<typeof api.music.update.input>;
export type MusicTrackResponse = z.infer<typeof api.music.create.responses[201]>;

export type BrandItemInput = z.infer<typeof api.brand.create.input>;
export type BrandItemUpdateInput = z.infer<typeof api.brand.update.input>;
export type BrandItemResponse = z.infer<typeof api.brand.create.responses[201]>;

export type ResumeItemInput = z.infer<typeof api.resume.create.input>;
export type ResumeItemUpdateInput = z.infer<typeof api.resume.update.input>;
export type ResumeItemResponse = z.infer<typeof api.resume.create.responses[201]>;

export type LinkItemInput = z.infer<typeof api.links.create.input>;
export type LinkItemUpdateInput = z.infer<typeof api.links.update.input>;
export type LinkItemResponse = z.infer<typeof api.links.create.responses[201]>;


import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      plan?: any;
      usage?: any;
      googleProfile?: {
        name?: string;
        picture?: string;
        given_name?: string;
        email_verified?: boolean;
        locale?: string;
      };
      status?: string;
      settings?: any;
      createdAt?: string;
      lastLogin?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    email?: string;
    name?: string;
    image?: string;
    plan?: any;
    usage?: any;
    googleProfile?: {
      name?: string;
      picture?: string;
      given_name?: string;
      email_verified?: boolean;
      locale?: string;
    };
    status?: string;
    settings?: any;
    createdAt?: string;
    lastLogin?: string;
  }
}

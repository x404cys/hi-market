/* import GoogleProvider from 'next-auth/providers/google';
import { type AuthOptions } from 'next-auth';
import { prisma } from '../lib/db';
import { UserRole } from '@/types/next-auth';

const isProd = process.env.NODE_ENV === 'production';

export const authOperation: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  jwt: {
    maxAge: 60 * 60 * 24,
  },
  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
        domain: isProd ? '.matager.store' : 'localhost',
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        token.id = dbUser?.id ?? user.id;
        token.email = dbUser?.email ?? user.email;
        token.name = dbUser?.name ?? user.name;
        token.role = dbUser?.role ?? 'TRADER';
      } else {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });

        if (dbUser) {
          token.name = dbUser.name;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.role = token.role as UserRole;
      return session;
    },

    async signIn({ user }) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email ?? undefined },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name ?? '',
            image: user.image ?? null,
            role: 'TRADER',
          },
        });
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('https://dashboard.matager.store')) {
        return url;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
 */
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { connectDB } from '@lib/mongodb';
import User from '@models/User';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account'
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },

  callbacks: {
    async signIn({ user, profile }) {
      console.log('🔐 SignIn attempt:', { user: user.email });

      try {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          console.log('🆕 Criando novo perfil de usuário...');
          await createUserProfile(user, profile);
        } else {
          console.log('🔄 Atualizando último login...');
          await updateLastLogin(user.email!);
        }
      } catch (err) {
        console.error('⚠️ Erro ao acessar o banco:', err);
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        try {
          await connectDB();
          const userProfile = await User.findOne({ email: user.email });

          if (userProfile) {
            token.userId = userProfile._id.toString();
            token.email = userProfile.email;
            token.name = userProfile.name;
            token.image = userProfile.image;
            token.plan = userProfile.plan ?? null;
            token.usage = userProfile.usage ?? null;
          }
        } catch (err) {
          console.error('❌ Erro no jwt callback:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.plan = token.plan;
        session.user.usage = token.usage;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes('/auth/error')) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },

  debug: process.env.NODE_ENV === 'development'
});

// 📌 Criação de perfil completo
async function createUserProfile(user: any, profile: any) {
  try {
    const newUser = new User({
      email: user.email,
      name: user.name,
      image: user.image,
      googleId: profile?.sub || profile?.id,

      googleProfile: {
        name: profile.name,
        picture: profile.picture,
        given_name: profile.given_name,
        family_name: profile.family_name,
        email_verified: profile.email_verified,
        locale: profile.locale ?? 'pt-BR',
        hd: profile.hd ?? null
      },

      plan: {
        type: 'free',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: {
          maxChannels: 3,
          maxCategories: 5,
          maxAnalysesPerMonth: 10,
          priorityProcessing: false,
          exportData: false,
          advancedFilters: false
        }
      },

      usage: {
        channelsCount: 0,
        categoriesCount: 0,
        analysesThisMonth: 0,
        lastAnalysis: null,
        loginCount: 1
      },

      settings: {
        language: profile.locale || 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          analysisComplete: true,
          monthlyReport: false
        }
      },

      createdAt: new Date(),
      lastLogin: new Date(),
      status: 'active'
    });

    await newUser.save();
    console.log('✅ Novo usuário salvo com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  }
}

// 📌 Atualização do último login
async function updateLastLogin(email: string) {
  try {
    await User.updateOne(
      { email },
      {
        $set: { lastLogin: new Date() },
        $inc: { 'usage.loginCount': 1 }
      }
    );
    console.log('✅ Último login atualizado');
  } catch (err) {
    console.error('❌ Erro ao atualizar login:', err);
  }
}

export { handler as GET, handler as POST };

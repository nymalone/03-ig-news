import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';

export default NextAuth({
  // configure one or more authentication providers 
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret:process.env.GITHUB_CLIENT_SECRET,
      scope: 'read:user'
    }),
  // more providers here if you need 
  ],
  // a data base is optional, but required to persist accounts is database 
  // database: 
})
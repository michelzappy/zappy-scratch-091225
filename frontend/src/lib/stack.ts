/**
 * Stack Auth Client Configuration
 * 
 * Integrates with Neon Auth for managed authentication
 */

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/patient/login",
    afterSignIn: "/patient/dashboard",
    afterSignOut: "/",
    signUp: "/patient/register",
    afterSignUp: "/patient/dashboard",
  },
});
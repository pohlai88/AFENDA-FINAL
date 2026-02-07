/**
 * Site configuration constants.
 * App-wide metadata used across marketing, SEO, and UI.
 */

export const siteConfig = {
  name: "AFENDA",
  description: "Your intelligent productivity platform",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  
  // Social links
  links: {
    twitter: "https://twitter.com/afenda",
    github: "https://github.com/afenda",
  },
  
  // Contact
  supportEmail: "support@afenda.app",
  
  // Branding
  logo: "/icons/icon-512x512.png",
  favicon: "/favicon.ico",
} as const;

export type SiteConfig = typeof siteConfig;

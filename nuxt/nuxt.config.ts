import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/i18n',
    '@nuxt/fonts',
    '@nuxt/image',
    '@vueuse/nuxt',
    'nuxt-kirby',
  ],

  compatibilityDate: '2025-08-01',

  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    public: {
      // Canonical URL of the deployed frontend, set via NUXT_PUBLIC_SITE_URL
      siteUrl: '',
    },
  },

  i18n: {
    // Required for hreflang/SEO links; override at runtime via
    // NUXT_PUBLIC_I18N_BASE_URL on the production host
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    locales: [
      { code: 'de', file: 'de.json', language: 'de-DE', name: 'Deutsch' },
      { code: 'en', file: 'en.json', language: 'en-US', name: 'English' },
    ],
    defaultLocale: 'de',
    strategy: 'prefix_except_default',
    compilation: {
      strictMessage: false,
    },
    bundle: {
      fullInstall: false,
    },
  },

  // Reads KIRBY_BASE_URL and KIRBY_API_TOKEN from the environment.
  // All Kirby requests go through a server-side proxy, so the token
  // is never exposed to the browser.
  kirby: {
    auth: 'bearer',
  },

  image: {
    format: ['webp'],
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
    },
  },
})

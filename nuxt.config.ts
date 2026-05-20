import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      backendBaseUrl: process.env.NUXT_PUBLIC_BACKEND_BASE_URL || 'http://127.0.0.1:8000',
      backendApiPrefix: process.env.NUXT_PUBLIC_BACKEND_API_PREFIX || '/api',
      mediaMtxBaseUrl: process.env.NUXT_PUBLIC_MEDIAMTX_BASE_URL || 'http://127.0.0.1:8889',
      mediaMtxControlApiUrl: process.env.NUXT_PUBLIC_MEDIAMTX_CONTROL_API_URL || 'http://127.0.0.1:9997/v3'
    }
  },
  buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  ui: {
    fonts: false
  },
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  compatibilityDate: '2026-04-07',
  // routeRules: {
  //   '/events': { ssr: false }
  // }
})

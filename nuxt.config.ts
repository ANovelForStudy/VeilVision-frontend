import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  buildDir: '.nuxt',
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
  compatibilityDate: '2026-04-07'
})

export default defineNuxtConfig({
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    'floating-vue/nuxt',
  ],

  ssr: false,
  app: {
    // 解决spa构建之后，js、css等资源文件使用绝对路径而找不到的问题
    baseURL: './',
  },
  router: {
    options: {
      // 解决spa构建之后在utools中首次进入时访问的路径是绝对路径的问题
      hashMode: true,
    },
  },
  experimental: {
    payloadExtraction: false,
    inlineSSRStyles: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  nitro: {
    routeRules: {
      '/*': {
        cors: true,
      },
    },
  },

  spaLoadingTemplate: false,

  vite: {
    vue: {
      script: {
        defineModel: true,
      },
    },
    server: {
      cors: true,
    },
  },

  imports: {
    dirs: [],
  },

  css: [
    '@unocss/reset/tailwind.css',
  ],

  devtools: {
    enabled: true,
    experimental: {
      timeline: true,
    },
  },
})

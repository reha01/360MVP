import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // ✅ DIAGNÓSTICO: Verificar que las variables de entorno se cargan
  if (mode === 'staging') {
    console.log('[Vite Config] 🔍 Modo staging detectado');
    console.log('[Vite Config] Buscando archivo .env.staging...');
  }
  
  return {
  plugins: [
    react({
      // Enable automatic JSX runtime (React 17+)
      // This allows JSX without explicit React imports
      jsxRuntime: 'automatic'
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false, // We'll handle registration manually
      manifest: {
        name: '360MVP - Evaluación Integral',
        short_name: '360MVP',
        description: 'Modelo Integral de Perfiles de Discipulado',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: "127.0.0.1",
    port: 5178,
    strictPort: true,
  },
  };
});
      // This allows JSX without explicit React imports
      jsxRuntime: 'automatic'
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false, // We'll handle registration manually
      manifest: {
        name: '360MVP - Evaluación Integral',
        short_name: '360MVP',
        description: 'Modelo Integral de Perfiles de Discipulado',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: "127.0.0.1",
    port: 5178,
    strictPort: true,
  },
  };
});
      // This allows JSX without explicit React imports
      jsxRuntime: 'automatic'
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false, // We'll handle registration manually
      manifest: {
        name: '360MVP - Evaluación Integral',
        short_name: '360MVP',
        description: 'Modelo Integral de Perfiles de Discipulado',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: "127.0.0.1",
    port: 5178,
    strictPort: true,
  },
  };
});
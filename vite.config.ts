import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import {
  handleCancelAuthorizedPaymentRequest,
  handleCapturePaymentRequest,
  handleRefundPaymentRequest,
  handleStripeCheckoutRequest,
  handleStripeCheckoutStatusRequest,
} from './server/stripeCheckout';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const stripeEnvironment = {
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    supabaseUrl: env.VITE_SUPABASE_URL,
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
  };
  const localStripeApiPlugin: PluginOption = {
    name: 'local-stripe-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/create-checkout-session', async (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        await handleStripeCheckoutRequest(request, response, {
          ...stripeEnvironment,
        });
      });

      server.middlewares.use('/api/checkout-session-status', async (request, response, next) => {
        if (request.method !== 'GET' || !request.url) {
          next();
          return;
        }

        const requestUrl = new URL(request.url, `http://${request.headers.host ?? 'localhost:3000'}`);
        await handleStripeCheckoutStatusRequest(requestUrl, response, {
          ...stripeEnvironment,
        });
      });

      server.middlewares.use('/api/capture-payment', async (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        await handleCapturePaymentRequest(request, response, {
          ...stripeEnvironment,
        });
      });

      server.middlewares.use('/api/cancel-authorized-payment', async (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        await handleCancelAuthorizedPaymentRequest(request, response, {
          ...stripeEnvironment,
        });
      });

      server.middlewares.use('/api/refund-payment', async (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        await handleRefundPaymentRequest(request, response, {
          ...stripeEnvironment,
        });
      });
    },
  };

  return {
    plugins: [react(), tailwindcss(), localStripeApiPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

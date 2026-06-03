import type { StripeCheckoutEnvironment } from '../../server/stripeCheckout';

type CloudflareEnv = Record<string, string | undefined>;

export interface PagesFunctionContext {
  request: Request;
  env: CloudflareEnv;
}

export function buildStripeEnvironment(env: CloudflareEnv): StripeCheckoutEnvironment {
  return {
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    supabaseUrl: env.VITE_SUPABASE_URL ?? env.SUPABASE_URL,
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY,
  };
}

export function jsonResponse(statusCode: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function methodNotAllowed(allowedMethod: string) {
  return jsonResponse(405, {
    error: `Méthode non autorisée. Utilisez ${allowedMethod}.`,
  });
}

import { processStripeCheckoutStatusRequest } from '../../server/stripeCheckout';
import { buildStripeEnvironment, jsonResponse, methodNotAllowed, type PagesFunctionContext } from './_shared';

export async function onRequestGet(context: PagesFunctionContext) {
  const result = await processStripeCheckoutStatusRequest(
    new URL(context.request.url),
    buildStripeEnvironment(context.env),
  );

  return jsonResponse(result.statusCode, result.body);
}

export async function onRequest(context: PagesFunctionContext) {
  if (context.request.method !== 'GET') {
    return methodNotAllowed('GET');
  }

  return onRequestGet(context);
}

import { processStripeCheckoutRequest } from '../../server/stripeCheckout';
import { buildStripeEnvironment, jsonResponse, methodNotAllowed, type PagesFunctionContext } from './_shared';

export async function onRequestPost(context: PagesFunctionContext) {
  const rawBody = await context.request.text();
  const result = await processStripeCheckoutRequest(
    rawBody,
    buildStripeEnvironment(context.env),
  );

  return jsonResponse(result.statusCode, result.body);
}

export async function onRequest(context: PagesFunctionContext) {
  if (context.request.method !== 'POST') {
    return methodNotAllowed('POST');
  }

  return onRequestPost(context);
}

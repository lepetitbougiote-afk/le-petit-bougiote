import type { CheckoutPayload } from '../types';

const PENDING_CHECKOUT_KEY = 'bougiote-pending-checkout';
const COMPLETED_CHECKOUT_KEY = 'bougiote-completed-checkout';

export interface PendingCheckoutSession {
  sessionId: string;
  payload: CheckoutPayload;
  createdAt: string;
}

export interface CompletedCheckoutSession {
  sessionId: string;
  orderId: string;
  completedAt: string;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function savePendingCheckoutSession(session: PendingCheckoutSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(session));
}

export function readPendingCheckoutSession(): PendingCheckoutSession | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingCheckoutSession;
  } catch {
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
    return null;
  }
}

export function clearPendingCheckoutSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
}

export function saveCompletedCheckoutSession(session: CompletedCheckoutSession) {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(COMPLETED_CHECKOUT_KEY, JSON.stringify(session));
}

export function readCompletedCheckoutSession(): CompletedCheckoutSession | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(COMPLETED_CHECKOUT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CompletedCheckoutSession;
  } catch {
    window.sessionStorage.removeItem(COMPLETED_CHECKOUT_KEY);
    return null;
  }
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  CartItem,
  ConfirmationStatus,
  DiningMode,
  FulfillmentType,
  OpeningHour,
  OrderStatus,
  UserProfile,
} from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined, fallback = 'Prix à confirmer') {
  if (typeof price !== 'number') {
    return fallback;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending_payment':
      return 'Paiement en attente';
    case 'awaiting_restaurant_confirmation':
      return 'En attente de confirmation';
    case 'pending':
      return 'En attente';
    case 'accepted':
      return 'Acceptée';
    case 'confirmed':
      return 'Confirmée';
    case 'time_adjustment_requested':
      return 'Horaire à confirmer';
    case 'preparing':
      return 'En préparation';
    case 'ready':
      return 'Prête';
    case 'completed':
      return 'Terminée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
}

export function getFulfillmentTypeLabel(fulfillmentType: FulfillmentType) {
  return fulfillmentType === 'delivery' ? 'Livraison' : 'Click & Collect';
}

export function getDiningModeLabel(diningMode: DiningMode) {
  if (diningMode === 'sur_place') {
    return 'Sur place';
  }
  if (diningMode === 'a_emporter') {
    return 'À emporter';
  }
  return 'Non précisé';
}

export function getDesiredTimeLabel(fulfillmentType: FulfillmentType) {
  return fulfillmentType === 'delivery' ? 'Créneau de livraison souhaité' : 'Heure souhaitée';
}

export function getConfirmationStatusLabel(status: ConfirmationStatus) {
  switch (status) {
    case 'confirmed':
      return 'Confirmée';
    case 'time_adjustment_requested':
      return 'Horaire à confirmer';
    case 'cancelled':
      return 'Annulée';
    case 'pending':
    default:
      return 'En attente de validation';
  }
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'authorized':
      return 'Paiement autorisé';
    case 'paid':
      return 'Paiement capturé';
    case 'cancelled':
      return 'Paiement annulé';
    case 'refunded':
      return 'Paiement remboursé';
    case 'capture_failed':
      return 'Capture échouée';
    case 'refund_failed':
      return 'Remboursement échoué';
    case 'unpaid':
    default:
      return 'Paiement en attente';
  }
}

export function getTodayOpeningStatus(openingHours: OpeningHour[], now = new Date()) {
  const dayIndex = now.getDay();
  const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const today = openingHours.find((item) => item.day === frenchDays[dayIndex]);
  if (!today || today.isClosed || !today.closesAt) {
    return 'Fermé aujourd’hui';
  }
  return `Ouvert jusqu’à ${today.closesAt.replace(':', 'h')}`;
}

export function needsProfileCompletion(profile: Pick<UserProfile, 'phone' | 'address' | 'role'> | null | undefined) {
  if (!profile) {
    return false;
  }

  if (profile.role === 'admin' || profile.role === 'super_admin') {
    return false;
  }

  return !profile.phone.trim() || !profile.address.trim();
}

export function getPostLoginPath(profile: Pick<UserProfile, 'phone' | 'address' | 'role'> | null | undefined) {
  if (!profile) {
    return '/connexion';
  }

  if (profile.role === 'admin' || profile.role === 'super_admin') {
    return '/admin/dashboard';
  }

  return needsProfileCompletion(profile) ? '/compte?complete=1' : '/compte';
}

export function sanitizeRedirectPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return null;
  }

  return path;
}

const DELIVERY_RESTRICTED_PRODUCT_IDS = new Set([
  'prod-formule-express',
  'prod-formule-classic',
  'prod-formule-pdj',
  'prod-formule-gourmande',
]);

const DELIVERY_RESTRICTED_CONFIGURATORS = new Set([
  'cafes-classiques',
  'boissons-gourmandes',
  'formule-gourmande',
]);

export function isDeliveryRestrictedCartItem(
  item: Pick<CartItem, 'productId' | 'configuratorKey'>,
) {
  return (
    DELIVERY_RESTRICTED_PRODUCT_IDS.has(item.productId) ||
    DELIVERY_RESTRICTED_CONFIGURATORS.has(item.configuratorKey ?? '')
  );
}

export type DayName =
  | 'Lundi'
  | 'Mardi'
  | 'Mercredi'
  | 'Jeudi'
  | 'Vendredi'
  | 'Samedi'
  | 'Dimanche';

export type CategorySlug = string;

export type GalleryCategory =
  | 'Burgers'
  | 'Cafes'
  | 'Desserts'
  | 'Terrasse'
  | 'Menu'
  | 'Ambiance';

export type OrderStatus =
  | 'pending'
  | 'pending_payment'
  | 'awaiting_restaurant_confirmation'
  | 'accepted'
  | 'confirmed'
  | 'time_adjustment_requested'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';
export type PaymentStatus =
  | 'unpaid'
  | 'authorized'
  | 'paid'
  | 'cancelled'
  | 'refunded'
  | 'capture_failed'
  | 'refund_failed';

export type FulfillmentType = 'click_collect' | 'delivery';
export type DiningMode = 'sur_place' | 'a_emporter' | null;
export type ConfirmationStatus =
  | 'pending'
  | 'confirmed'
  | 'time_adjustment_requested'
  | 'cancelled';
export type OrderSource = 'menu_qr' | 'delivery_web';
export type PaymentMode = 'online_payment_pending';
export type ProductImageStatus = 'placeholder' | 'planned' | 'real';
export type ProductImageFit = 'cover' | 'contain';
export type ProductType = 'simple' | 'configurable';
export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface OpeningHour {
  day: DayName;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

export interface BusinessSettings {
  name: string;
  brandLine: string;
  address: string;
  city: string;
  postalCode: string;
  phonePrimary: string;
  phoneSecondary: string;
  mapUrl: string;
  reviewUrl: string;
  leaveReviewUrl: string;
  orderModeLabel: string;
  services: string[];
  rating: number;
  reviewCountLabel: string;
  priceRange: string;
  openingHours: OpeningHour[];
  announcement: string;
  orderingEnabled: boolean;
  googleAnalyticsMeasurementId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: number | null;
  priceLabel?: string;
  isAvailable: boolean;
  availabilityNote?: string;
  isActive: boolean;
  tags: string[];
  sortOrder: number;
  image: string;
  imageAlt: string;
  imageStatus: ProductImageStatus;
  imageFit?: ProductImageFit;
  productType?: ProductType;
  configuratorKey?: string;
}

export interface ProductChoiceOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive?: boolean;
  meta?: Record<string, string | number | boolean | null>;
}

export interface ProductChoiceGroup {
  id: string;
  name: string;
  helperText?: string;
  required: boolean;
  sortOrder: number;
  options: ProductChoiceOption[];
}

export interface ProductConfigurator {
  key: string;
  productId: string;
  title: string;
  description: string;
  quantityEnabled: boolean;
  choiceGroups: ProductChoiceGroup[];
}

export interface GalleryImage {
  id: string;
  title: string;
  alt: string;
  category: GalleryCategory;
  image: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ReviewStat {
  rating: number;
  reviewCountLabel: string;
}

export interface ReviewExample {
  id: string;
  title: string;
  content: string;
  isExample: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number | null;
  priceLabel?: string;
  quantity: number;
  note: string;
  image: string;
  imageAlt: string;
  imageFit?: ProductImageFit;
  configuratorKey?: string;
  selectedOptions?: Array<{
    groupId: string;
    optionId: string;
    label: string;
    price: number;
  }>;
}

export interface CheckoutPayload {
  fulfillmentType: FulfillmentType;
  diningMode: DiningMode;
  orderSource: OrderSource;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  desiredTime?: string;
  confirmationStatus?: ConfirmationStatus;
  proposedTime?: string;
  customerConfirmationRequired?: boolean;
  customerConfirmedAt?: string | null;
  restaurantNote?: string;
  customerNote?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMode: PaymentMode;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  customerCanCancelUntil?: string | null;
  confirmedDeliveryTime?: string | null;
  cancelledAt?: string | null;
  refundId?: string | null;
  refundStatus?: string | null;
  cancellationReason?: string | null;
  items: CartItem[];
}

export interface Order {
  id: string;
  fulfillmentType: FulfillmentType;
  diningMode: DiningMode;
  orderSource: OrderSource;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  desiredTime?: string;
  confirmationStatus: ConfirmationStatus;
  proposedTime?: string;
  customerConfirmationRequired: boolean;
  customerConfirmedAt?: string | null;
  restaurantNote?: string;
  customerNote?: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMode: PaymentMode;
  createdAt: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  customerCanCancelUntil?: string | null;
  confirmedDeliveryTime?: string | null;
  cancelledAt?: string | null;
  refundId?: string | null;
  refundStatus?: string | null;
  cancellationReason?: string | null;
  publicConfirmationToken?: string | null;
  confirmationLinkExpiresAt?: string | null;
  lastCustomerNotificationAt?: string | null;
  notes?: string;
  subtotal: number;
  total: number;
  items: Array<{
    productId: string | null;
    productNameSnapshot: string;
    unitPriceSnapshot: number;
    quantity: number;
    itemNotes?: string;
    selectedOptions?: Array<{
      groupId: string;
      optionId: string;
      label: string;
      price: number;
    }>;
    total: number;
  }>;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  role?: UserRole;
}

export interface CustomerSummary extends UserProfile {
  orderCount: number;
  lastOrderDate: string;
}

export interface DashboardStats {
  todaysOrders: number;
  pendingOrders: number;
  revenueEstimate: number;
  completedOrders: number;
  openingStatus: string;
  announcementStatus: string;
}

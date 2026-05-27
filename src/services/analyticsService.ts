type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
let analyticsReady = false;

export const analyticsService = {
  initAnalytics() {
    if (!measurementId || analyticsReady || typeof window === 'undefined') {
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
    window.gtag =
      window.gtag ??
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
    analyticsReady = true;
  },

  trackEvent(eventName: string, payload?: AnalyticsPayload) {
    if (!measurementId || typeof window === 'undefined' || !window.gtag) {
      return;
    }
    window.gtag('event', eventName, payload ?? {});
  },

  trackCallClick() {
    this.trackEvent('call_click');
  },

  trackDirectionsClick() {
    this.trackEvent('directions_click');
  },

  trackAddToCart(payload?: AnalyticsPayload) {
    this.trackEvent('add_to_cart', payload);
  },

  trackCheckoutStart(payload?: AnalyticsPayload) {
    this.trackEvent('checkout_start', payload);
  },

  trackOrderSubmitted(payload?: AnalyticsPayload) {
    this.trackEvent('order_submitted', payload);
  },

  trackAdminOrderStatusUpdate(payload?: AnalyticsPayload) {
    this.trackEvent('admin_order_status_update', payload);
  },
};

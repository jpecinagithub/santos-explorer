import { track as vercelTrack } from "@vercel/analytics";

export type AnalyticsEvent =
  | "search_performed"
  | "saint_opened"
  | "saint_page_viewed"
  | "tag_selected"
  | "order_selected"
  | "century_selected"
  | "history_opened"
  | "random_saint"
  | "language_changed"
  | "wikipedia_external_link_clicked";

/** Anonymous product-event tracking. No personal data is collected. */
export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number>): void {
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics unavailable — never break the app */
  }
}

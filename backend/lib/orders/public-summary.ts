/** Guest tracking must never disclose saved addresses, phone numbers or internal event notes. */
export function guestOrderSummary(order: Record<string, unknown>): Record<string, unknown> {
  const fields = ["id", "order_number", "currency", "subtotal", "discount_total", "gift_card_total",
    "shipping_total", "tax_total", "total", "payment_status", "fulfillment_status", "created_at",
    "order_items", "tracking_carrier", "tracking_number", "tax_included"];
  const summary = Object.fromEntries(fields.filter(key => key in order).map(key => [key, order[key]]));
  if (Array.isArray(order.order_events)) summary.order_events = order.order_events.map(event => ({
    event_type: event.event_type, created_at: event.created_at,
  }));
  return summary;
}

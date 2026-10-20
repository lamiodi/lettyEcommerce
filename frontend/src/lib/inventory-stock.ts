/** Reserved units are not available for another shopper to purchase. */
export function availableStock(record?: { stockQuantity: number; reservedQuantity: number }): number {
  if (!record || !Number.isFinite(record.stockQuantity) || !Number.isFinite(record.reservedQuantity)) return 0;
  return Math.max(0, Math.floor(record.stockQuantity) - Math.max(0, Math.floor(record.reservedQuantity)));
}

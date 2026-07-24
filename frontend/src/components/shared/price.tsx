import { cn, formatPrice } from "@/lib/utils";

interface PriceProps {
  price: number;
  compareAt?: number;
  currency?: string;
  className?: string;
}

export function Price({ price, compareAt, currency = "USD", className }: PriceProps) {
  const onSale = compareAt != null && compareAt > price;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-medium", onSale && "text-[#8E2A2B]")}>
        {formatPrice(price, currency)}
      </span>
      {onSale && (
        <span className="text-sm text-stone line-through">
          {formatPrice(compareAt, currency)}
        </span>
      )}
    </span>
  );
}

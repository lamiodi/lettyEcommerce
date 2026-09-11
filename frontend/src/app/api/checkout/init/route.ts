import { NextRequest, NextResponse } from "next/server";
import { createOrderInStore, type AdminCurrency, type OrderItemInput } from "@/lib/orders/order-store";
import { createStripePaymentIntent } from "@/lib/payments/stripe";
import { products } from "@/lib/mock/products";
import { EXCHANGE_RATES, ZERO_DECIMAL_CURRENCIES, type CurrencyCode } from "@/lib/data/countries";
import { calculateShipping } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cart = [],
      customerEmail,
      customerFirstName = "",
      customerLastName = "",
      customerPhone,
      shippingAddress,
      billingAddress,
      currency = "USD",
      subtotal: clientSubtotal,
      shippingTotal: clientShippingTotal,
      total: clientTotal,
      notes,
    } = body;

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return NextResponse.json({ error: "Valid shipping address is required" }, { status: 400 });
    }

    // Currency routing: All countries now use Stripe
    const validCurrency = (["USD", "EUR", "GBP", "CAD", "NGN", "GHS", "ZAR", "KES"].includes(currency)
      ? currency
      : "USD") as AdminCurrency;

    const rate = EXCHANGE_RATES[validCurrency as CurrencyCode] ?? 1.0;
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(validCurrency as CurrencyCode);

    const convertGbp = (gbpAmount: number) => {
      const converted = gbpAmount * rate;
      return isZeroDecimal ? Math.round(converted) : Math.round(converted * 100) / 100;
    };

    // Determine lines with product metadata & currency-converted price
    const enrichedCart: OrderItemInput[] = cart.map((item: any) => {
      const product = products.find(
        (p) => p.id === item.productId || p.slug === item.productSlug
      );
      const variant = product?.variants.find((v) => v.id === item.variantId);

      const baseGbpPrice =
        variant?.priceOverrideUsd ??
        (variant as any)?.price ??
        product?.basePriceUsd ??
        (product as any)?.price ??
        28;

      const unitPrice =
        typeof item.unitPrice === "number" && item.unitPrice > 0
          ? item.unitPrice
          : convertGbp(baseGbpPrice);

      const shade =
        (variant as any)?.name ||
        (typeof variant?.color === "string" ? variant.color : undefined) ||
        item.shade ||
        undefined;

      const image =
        variant?.images?.[0] ||
        variant?.image ||
        (product?.media?.[0] as any)?.url ||
        (product?.media?.[0] as any)?.imageKey ||
        item.image ||
        "/products/lip-liner/01-cafe-creme/IMG_6625 (1).PNG";

      return {
        productId: item.productId || product?.id || "letty-velvet-lip-liner",
        productSlug: item.productSlug || product?.slug || "letty-velvet-lip-liner",
        variantId: item.variantId || variant?.id || "variant-1",
        quantity: item.quantity || 1,
        name: product?.name || "Letty Velvet Sculpt Lip Liner",
        image,
        unitPrice,
        shade,
      };
    });

    const calculatedSubtotal = enrichedCart.reduce(
      (sum, item) => sum + (item.unitPrice || convertGbp(28)) * item.quantity,
      0
    );
    const subtotal =
      typeof clientSubtotal === "number" && clientSubtotal > 0
        ? clientSubtotal
        : calculatedSubtotal;

    const defaultShipping = calculateShipping(
      subtotal,
      shippingAddress?.country || "GB",
      validCurrency
    );
    const shippingTotal =
      typeof clientShippingTotal === "number" ? clientShippingTotal : defaultShipping;

    const taxTotal = 0;
    const total =
      typeof clientTotal === "number" && clientTotal > 0
        ? clientTotal
        : Math.round((subtotal + shippingTotal + taxTotal) * 100) / 100;

    // Temporary reference to create payment intent
    const tempOrderNum = `LTY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let stripeIntentId = "";
    let clientSecret = "";

    try {
      const stripeResult = await createStripePaymentIntent({
        amount: total,
        currency: validCurrency,
        customerEmail,
        orderNumber: tempOrderNum,
        metadata: {
          customer_name: `${customerFirstName} ${customerLastName}`.trim(),
          cart_items: enrichedCart.length.toString(),
          country: shippingAddress.country || "",
        },
      });
      stripeIntentId = stripeResult.id;
      clientSecret = stripeResult.clientSecret;
    } catch (stripeErr: any) {
      console.error("Stripe PaymentIntent creation error:", stripeErr.message);
      return NextResponse.json(
        { error: `Payment gateway error: ${stripeErr.message}` },
        { status: 500 }
      );
    }

    // Persist order in store & database with Stripe
    const order = await createOrderInStore({
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      shippingAddress,
      billingAddress,
      cart: enrichedCart,
      currency: validCurrency,
      subtotal,
      shippingTotal,
      taxTotal,
      total,
      paymentGateway: "stripe",
      paymentReference: stripeIntentId,
      paymentStatus: "pending",
      notes,
    });

    return NextResponse.json(
      {
        data: {
          orderId: order.order_number,
          order_id: order.id,
          orderNumber: order.order_number,
          order_number: order.order_number,
          paymentIntentId: stripeIntentId,
          clientSecret,
          client_secret: clientSecret,
          gateway: "stripe",
          amount: order.total,
          currency: order.currency,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Checkout init handler error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize checkout" },
      { status: 500 }
    );
  }
}

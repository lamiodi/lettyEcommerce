import { NextRequest, NextResponse } from "next/server";
import { createOrderInStore, generateOrderNumber, type AdminCurrency } from "@/lib/orders/order-store";
import { createStripePaymentIntent } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.cart || !Array.isArray(body.cart) || body.cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty or invalid" }, { status: 400 });
    }

    const {
      cart,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      shippingAddress,
      billingSameAsShipping,
      billingAddress,
      currency,
      subtotal,
      shippingTotal,
      total,
      notes,
    } = body;

    if (!customerEmail || typeof customerEmail !== "string" || !customerEmail.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
      return NextResponse.json({ error: "Complete shipping address is required." }, { status: 400 });
    }

    const validCurrency = (currency || "GBP").toUpperCase() as AdminCurrency;
    const finalSubtotal = Number(subtotal) || 0;
    const finalShipping = Number(shippingTotal) || 0;
    const grandTotal = Math.max(0.5, Number(total) || finalSubtotal + finalShipping);

    const orderNumber = generateOrderNumber();

    // 1. Create Stripe PaymentIntent with automatic payment methods and metadata
    const paymentIntent = await createStripePaymentIntent({
      amount: grandTotal,
      currency: validCurrency,
      customerEmail: customerEmail.trim(),
      orderNumber,
      metadata: {
        order_number: orderNumber,
        customer_email: customerEmail.trim(),
        customer_name: `${customerFirstName ?? ""} ${customerLastName ?? ""}`.trim(),
      },
    });

    // 2. Persist order in local store and PostgreSQL
    const order = await createOrderInStore({
      customerEmail: customerEmail.trim(),
      customerFirstName: customerFirstName?.trim(),
      customerLastName: customerLastName?.trim(),
      customerPhone: customerPhone?.trim(),
      shippingAddress: {
        first_name: shippingAddress.first_name || customerFirstName,
        last_name: shippingAddress.last_name || customerLastName,
        phone: shippingAddress.phone || customerPhone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || shippingAddress.city,
        country: shippingAddress.country,
        postal_code: shippingAddress.postal_code,
      },
      billingAddress: billingSameAsShipping
        ? undefined
        : billingAddress
        ? {
            first_name: billingAddress.first_name || customerFirstName,
            last_name: billingAddress.last_name || customerLastName,
            street: billingAddress.street,
            city: billingAddress.city,
            state: billingAddress.state || billingAddress.city,
            country: billingAddress.country,
            postal_code: billingAddress.postal_code,
          }
        : undefined,
      cart: cart.map((item: any) => ({
        productId: item.productId || item.productSlug || item.variantId || "letty-item",
        productSlug: item.productSlug,
        variantId: item.variantId || item.variant_id,
        quantity: Number(item.quantity) || 1,
        name: item.name,
        image: item.image,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
        shade: item.shade,
      })),
      currency: validCurrency,
      subtotal: finalSubtotal,
      shippingTotal: finalShipping,
      total: grandTotal,
      paymentGateway: "stripe",
      paymentReference: paymentIntent.id,
      paymentStatus: "pending",
      notes: notes || undefined,
      orderNumber,
    });

    return NextResponse.json(
      {
        data: {
          order_id: order.id,
          order_number: order.order_number,
          orderId: order.id,
          orderNumber: order.order_number,
          gateway: "stripe",
          currency: order.currency,
          amount: order.total,
          client_secret: paymentIntent.clientSecret,
          clientSecret: paymentIntent.clientSecret,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Checkout init error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during checkout initialization" },
      { status: 500 }
    );
  }
}

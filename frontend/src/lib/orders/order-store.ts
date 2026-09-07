import { Pool } from "pg";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export type AdminCurrency = "USD" | "EUR" | "GBP" | "NGN" | "GHS" | "ZAR" | "KES" | "CAD";

export interface OrderItemInput {
  productId: string;
  productSlug?: string;
  variantId?: string;
  quantity: number;
  name?: string;
  image?: string;
  unitPrice?: number;
  shade?: string;
}

export interface CreateOrderPayload {
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  shippingAddress: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    street: string;
    city: string;
    state?: string;
    country: string;
    postal_code?: string;
  };
  billingAddress?: {
    first_name?: string;
    last_name?: string;
    street: string;
    city: string;
    state?: string;
    country: string;
    postal_code?: string;
  };
  cart: OrderItemInput[];
  currency: AdminCurrency;
  subtotal: number;
  shippingTotal: number;
  taxTotal?: number;
  total: number;
  paymentGateway: "stripe" | "paystack";
  paymentReference?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  notes?: string;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  customer_email: string;
  currency: AdminCurrency;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  payment_status: string;
  fulfillment_status: string;
  payment_gateway: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  internal_notes: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  customers: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string | null;
  } | null;
  billing_address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string | null;
  } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_snapshot: {
      name: string;
      slug: string;
      primary_image: string | null;
      options?: Array<{ name: string; value: string }>;
    };
  }>;
  order_events: Array<{
    id: string;
    event_type: string;
    metadata: any;
    created_at: string;
  }>;
}

const CACHE_FILE = path.join(process.cwd(), ".orders-cache.json");

function readCache(): AdminOrder[] {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to read order cache:", e);
  }
  return [];
}

function writeCache(orders: AdminOrder[]) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write order cache:", e);
  }
}

let pool: Pool | null = null;
function getDbPool(): Pool | null {
  if (pool) return pool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    return pool;
  } catch (e) {
    console.warn("Postgres pool creation failed:", e);
    return null;
  }
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LTY-${year}-${random}`;
}

export async function createOrderInStore(payload: CreateOrderPayload): Promise<AdminOrder> {
  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();
  const customerId = crypto.randomUUID();

  const customerName = [payload.customerFirstName, payload.customerLastName].filter(Boolean).join(" ");
  const shipAddr = payload.shippingAddress;
  const billAddr = payload.billingAddress || shipAddr;

  const orderItems = payload.cart.map((item) => {
    const unitPrice = item.unitPrice ?? Math.round((payload.subtotal / Math.max(1, payload.cart.length)) * 100) / 100;
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    return {
      id: crypto.randomUUID(),
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      product_snapshot: {
        name: item.name || "Letty Velvet Sculpt Lip Liner",
        slug: item.productSlug || "letty-velvet-lip-liner",
        primary_image: item.image || "/products/lip-liner/01-cafe-creme/IMG_6625_clean.jpg",
        options: item.shade ? [{ name: "Shade", value: item.shade }] : [{ name: "Shade", value: "01 Cafe Creme" }],
      },
    };
  });

  const orderEvents = [
    {
      id: crypto.randomUUID(),
      event_type: "placed",
      metadata: {
        source: "web_checkout",
        gateway: payload.paymentGateway,
        reference: payload.paymentReference,
      },
      created_at: now,
    },
  ];

  if (payload.paymentStatus === "paid") {
    orderEvents.push({
      id: crypto.randomUUID(),
      event_type: "paid",
      metadata: { source: "checkout", gateway: payload.paymentGateway, reference: payload.paymentReference },
      created_at: now,
    });
  }

  const order: AdminOrder = {
    id: orderId,
    order_number: orderNumber,
    customer_email: payload.customerEmail,
    currency: payload.currency,
    subtotal: payload.subtotal,
    shipping_total: payload.shippingTotal,
    tax_total: payload.taxTotal || 0,
    total: payload.total,
    payment_status: payload.paymentStatus || "pending",
    fulfillment_status: "unfulfilled",
    payment_gateway: payload.paymentGateway,
    payment_reference: payload.paymentReference || null,
    paid_at: payload.paymentStatus === "paid" ? now : null,
    created_at: now,
    updated_at: now,
    internal_notes: payload.notes || null,
    tracking_carrier: null,
    tracking_number: null,
    customers: {
      id: customerId,
      email: payload.customerEmail,
      first_name: payload.customerFirstName || null,
      last_name: payload.customerLastName || null,
      phone: payload.customerPhone || null,
    },
    shipping_address: {
      street: shipAddr.street,
      city: shipAddr.city,
      state: shipAddr.state || shipAddr.city,
      country: shipAddr.country,
      postal_code: shipAddr.postal_code || null,
    },
    billing_address: {
      street: billAddr.street,
      city: billAddr.city,
      state: billAddr.state || billAddr.city,
      country: billAddr.country,
      postal_code: billAddr.postal_code || null,
    },
    order_items: orderItems,
    order_events: orderEvents,
  };

  // 1. Cache locally for instant availability
  const cache = readCache();
  cache.unshift(order);
  writeCache(cache);

  // 2. Persist to Postgres database if available
  const db = getDbPool();
  if (db) {
    try {
      // Upsert customer
      const custRes = await db.query(
        `INSERT INTO customers (id, email, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET first_name = COALESCE(EXCLUDED.first_name, customers.first_name)
         RETURNING id`,
        [customerId, payload.customerEmail, payload.customerFirstName || null, payload.customerLastName || null, payload.customerPhone || null]
      );
      const dbCustId = custRes.rows[0]?.id || customerId;

      // Insert shipping address
      const addrRes = await db.query(
        `INSERT INTO addresses (customer_id, first_name, last_name, phone, street, city, state, country, postal_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [dbCustId, payload.customerFirstName || "Customer", payload.customerLastName || "", payload.customerPhone || null, shipAddr.street, shipAddr.city, shipAddr.state || shipAddr.city, shipAddr.country, shipAddr.postal_code || null]
      );
      const addrId = addrRes.rows[0]?.id;

      // Insert order
      await db.query(
        `INSERT INTO orders (id, order_number, customer_id, customer_email, customer_phone, shipping_address_id, currency, subtotal, shipping_total, tax_total, total, payment_gateway, payment_reference, payment_status, fulfillment_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [orderId, orderNumber, dbCustId, payload.customerEmail, payload.customerPhone || null, addrId, payload.currency, payload.subtotal, payload.shippingTotal, payload.taxTotal || 0, payload.total, payload.paymentGateway, payload.paymentReference || null, payload.paymentStatus || "pending", "unfulfilled", payload.notes || null]
      );

      // Find an existing product and variant in DB for foreign key constraint
      const prodRes = await db.query("SELECT id FROM products LIMIT 1");
      const varRes = await db.query("SELECT id FROM product_variants LIMIT 1");
      const defaultProdId = prodRes.rows[0]?.id;
      const defaultVarId = varRes.rows[0]?.id;

      if (defaultProdId && defaultVarId) {
        for (const item of orderItems) {
          await db.query(
            `INSERT INTO order_items (id, order_id, product_id, variant_id, product_snapshot, quantity, unit_price, line_total)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [item.id, orderId, defaultProdId, defaultVarId, JSON.stringify(item.product_snapshot), item.quantity, item.unit_price, item.line_total]
          );
        }
      }

      // Insert event
      await db.query(
        `INSERT INTO order_events (order_id, event_type, metadata)
         VALUES ($1, $2, $3)`,
        [orderId, "placed", JSON.stringify({ gateway: payload.paymentGateway, reference: payload.paymentReference })]
      );
    } catch (dbErr) {
      console.warn("Could not save order directly to PG (cache active):", dbErr);
    }
  }

  return order;
}

export async function listOrdersFromStore(params?: {
  query?: string;
  payment_status?: string;
  fulfillment_status?: string;
  currency?: string;
}): Promise<AdminOrder[]> {
  const cachedOrders = readCache();

  // Try fetching from DB to merge any DB orders
  const db = getDbPool();
  if (db) {
    try {
      const res = await db.query(
        `SELECT o.*, 
                json_build_object('id', c.id, 'email', c.email, 'first_name', c.first_name, 'last_name', c.last_name, 'phone', c.phone) as customers,
                json_build_object('street', a.street, 'city', a.city, 'state', a.state, 'country', a.country, 'postal_code', a.postal_code) as shipping_address
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN addresses a ON o.shipping_address_id = a.id
         ORDER BY o.created_at DESC`
      );

      for (const row of res.rows) {
        if (!cachedOrders.some((co) => co.id === row.id || co.order_number === row.order_number)) {
          // Fetch items for this DB order
          const itemsRes = await db.query("SELECT * FROM order_items WHERE order_id = $1", [row.id]);
          const eventsRes = await db.query("SELECT * FROM order_events WHERE order_id = $1 ORDER BY created_at ASC", [row.id]);

          cachedOrders.push({
            id: row.id,
            order_number: row.order_number,
            customer_email: row.customer_email,
            currency: row.currency,
            subtotal: parseFloat(row.subtotal),
            shipping_total: parseFloat(row.shipping_total),
            tax_total: parseFloat(row.tax_total),
            total: parseFloat(row.total),
            payment_status: row.payment_status,
            fulfillment_status: row.fulfillment_status,
            payment_gateway: row.payment_gateway,
            payment_reference: row.payment_reference,
            paid_at: row.paid_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            internal_notes: row.internal_notes,
            tracking_carrier: row.tracking_carrier,
            tracking_number: row.tracking_number,
            customers: row.customers,
            shipping_address: row.shipping_address,
            billing_address: row.shipping_address,
            order_items: itemsRes.rows.map((it: any) => ({
              id: it.id,
              quantity: it.quantity,
              unit_price: parseFloat(it.unit_price),
              line_total: parseFloat(it.line_total),
              product_snapshot: typeof it.product_snapshot === "string" ? JSON.parse(it.product_snapshot) : it.product_snapshot,
            })),
            order_events: eventsRes.rows.map((ev: any) => ({
              id: ev.id,
              event_type: ev.event_type,
              metadata: typeof ev.metadata === "string" ? JSON.parse(ev.metadata) : ev.metadata,
              created_at: ev.created_at,
            })),
          });
        }
      }
    } catch (err) {
      console.warn("DB orders fetch failed, serving from cache:", err);
    }
  }

  let filtered = [...cachedOrders];

  if (params?.query) {
    const q = params.query.toLowerCase().trim();
    filtered = filtered.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        (o.customers?.first_name && o.customers.first_name.toLowerCase().includes(q)) ||
        (o.customers?.last_name && o.customers.last_name.toLowerCase().includes(q))
    );
  }

  if (params?.payment_status) {
    filtered = filtered.filter((o) => o.payment_status === params.payment_status);
  }

  if (params?.fulfillment_status) {
    filtered = filtered.filter((o) => o.fulfillment_status === params.fulfillment_status);
  }

  if (params?.currency) {
    filtered = filtered.filter((o) => o.currency === params.currency);
  }

  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return filtered;
}

export async function getOrderFromStore(idOrNumber: string): Promise<AdminOrder | null> {
  const orders = await listOrdersFromStore();
  return orders.find((o) => o.id === idOrNumber || o.order_number === idOrNumber) || null;
}

export async function updateOrderInStore(
  id: string,
  updates: Partial<{
    payment_status: string;
    fulfillment_status: string;
    internal_notes: string;
    tracking_carrier: string;
    tracking_number: string;
    event: { type: string; metadata?: any };
  }>
): Promise<AdminOrder | null> {
  const cache = readCache();
  const order = cache.find((o) => o.id === id || o.order_number === id);
  if (!order) return null;

  const now = new Date().toISOString();
  if (updates.payment_status) order.payment_status = updates.payment_status;
  if (updates.fulfillment_status) order.fulfillment_status = updates.fulfillment_status;
  if (updates.internal_notes !== undefined) order.internal_notes = updates.internal_notes;
  if (updates.tracking_carrier !== undefined) order.tracking_carrier = updates.tracking_carrier;
  if (updates.tracking_number !== undefined) order.tracking_number = updates.tracking_number;
  order.updated_at = now;

  if (updates.event) {
    order.order_events.push({
      id: crypto.randomUUID(),
      event_type: updates.event.type,
      metadata: updates.event.metadata || {},
      created_at: now,
    });
  }

  writeCache(cache);

  const db = getDbPool();
  if (db) {
    try {
      await db.query(
        `UPDATE orders 
         SET payment_status = COALESCE($1, payment_status),
             fulfillment_status = COALESCE($2, fulfillment_status),
             internal_notes = COALESCE($3, internal_notes),
             updated_at = NOW()
         WHERE id = $4`,
        [updates.payment_status || null, updates.fulfillment_status || null, updates.internal_notes || null, order.id]
      );
    } catch (e) {
      console.warn("DB update failed:", e);
    }
  }

  return order;
}

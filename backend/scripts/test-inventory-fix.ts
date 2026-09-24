/**
 * One-off functional test for migration 022, run entirely inside a
 * transaction that is rolled back — the live DB is left untouched.
 *
 * Scenario: reserve 1 unit → release (simulating a declined payment
 * webhook) → commit (simulating a successful retry on the same intent).
 * Pre-fix, commit could not deduct anything and stock was restored in
 * full despite the sale. Post-fix, stock must end 1 lower than it
 * started and the ledger must carry a compensating SALE row.
 *
 * Usage: npx tsx scripts/test-inventory-fix.ts
 */
import "dotenv/config";
import { Client } from "pg";

function safeConnString(raw: string): string {
  const schemeMatch = raw.match(/^postgres(?:ql)?:\/\//);
  if (!schemeMatch) return raw;
  const scheme = schemeMatch[0];
  const rest = raw.slice(scheme.length);
  const at = rest.lastIndexOf("@");
  if (at === -1) return raw;
  const userinfo = rest.slice(0, at);
  const hostPart = rest.slice(at + 1);
  const colon = userinfo.indexOf(":");
  if (colon === -1) return raw;
  return `${scheme}${encodeURIComponent(userinfo.slice(0, colon))}:${encodeURIComponent(userinfo.slice(colon + 1))}@${hostPart}`;
}

const client = new Client({
  connectionString: safeConnString(process.env.DATABASE_URL!),
  ssl: { rejectUnauthorized: false },
});

function assert(cond: boolean, label: string, detail?: unknown) {
  if (!cond) {
    console.error(`❌ ${label}`, detail ?? "");
    throw new Error(label);
  }
  console.log(`✅ ${label}`);
}

async function main() {
try {
  await client.connect();
  await client.query("BEGIN");

  const variant = (await client.query(
    `SELECT id, product_id, stock_quantity, reserved_quantity
     FROM product_variants WHERE is_active = true LIMIT 1`,
  )).rows[0];
  console.log(`Variant ${variant.id}: stock=${variant.stock_quantity} reserved=${variant.reserved_quantity}`);

  const order = (await client.query(
    `INSERT INTO orders (customer_email, currency, subtotal, total, payment_gateway, payment_reference)
     VALUES ('test@example.com', 'GBP', 1, 1, 'stripe', 'pi_test_022') RETURNING id`,
  )).rows[0];
  await client.query(
    `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, line_total, product_snapshot)
     VALUES ($1, $2, $3, 1, 1, 1, '{"name":"test"}'::jsonb)`,
    [order.id, variant.product_id, variant.id],
  );

  // 1. Reserve (checkout init)
  await client.query(`SELECT public.reserve_inventory($1, $2::jsonb)`, [
    order.id,
    JSON.stringify([{ variant_id: variant.id, quantity: 1 }]),
  ]);
  let row = (await client.query(`SELECT stock_quantity, reserved_quantity FROM product_variants WHERE id = $1`, [variant.id])).rows[0];
  assert(row.stock_quantity === variant.stock_quantity - 1 && row.reserved_quantity === variant.reserved_quantity + 1, "reserve decrements stock, bumps reserved", row);

  // 2. Declined payment → webhook releases
  await client.query(`SELECT public.release_inventory($1)`, [order.id]);
  row = (await client.query(`SELECT stock_quantity, reserved_quantity FROM product_variants WHERE id = $1`, [variant.id])).rows[0];
  assert(row.stock_quantity === variant.stock_quantity && row.reserved_quantity === variant.reserved_quantity, "release restores stock and reserved", row);

  // 3. Retry on the same PaymentIntent succeeds → commit
  await client.query(`SELECT public.commit_inventory($1)`, ["pi_test_022"]);
  row = (await client.query(`SELECT stock_quantity, reserved_quantity FROM product_variants WHERE id = $1`, [variant.id])).rows[0];
  assert(row.stock_quantity === variant.stock_quantity - 1 && row.reserved_quantity === variant.reserved_quantity, "commit re-deducts the released unit (THE FIX)", row);

  const tx = (await client.query(
    `SELECT change_quantity FROM inventory_transactions WHERE reference_id = $1 ORDER BY created_at`,
    [order.id],
  )).rows.map((r: { change_quantity: number }) => r.change_quantity);
  assert(tx.reduce((a: number, b: number) => a + b, 0) === -1, "ledger reconciles to net -1 (SALE, release, SALE)", tx);

  // 4. Normal path unchanged: fresh reserve + commit without a release
  const order2 = (await client.query(
    `INSERT INTO orders (customer_email, currency, subtotal, total, payment_gateway, payment_reference)
     VALUES ('test@example.com', 'GBP', 1, 1, 'stripe', 'pi_test_022_normal') RETURNING id`,
  )).rows[0];
  await client.query(
    `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, line_total, product_snapshot)
     VALUES ($1, $2, $3, 1, 1, 1, '{"name":"test"}'::jsonb)`,
    [order2.id, variant.product_id, variant.id],
  );
  await client.query(`SELECT public.reserve_inventory($1, $2::jsonb)`, [
    order2.id,
    JSON.stringify([{ variant_id: variant.id, quantity: 1 }]),
  ]);
  await client.query(`SELECT public.commit_inventory($1)`, ["pi_test_022_normal"]);
  row = (await client.query(`SELECT stock_quantity, reserved_quantity FROM product_variants WHERE id = $1`, [variant.id])).rows[0];
  assert(row.stock_quantity === variant.stock_quantity - 2 && row.reserved_quantity === variant.reserved_quantity, "normal reserve→commit still deducts exactly once", row);

  await client.query("ROLLBACK");
  console.log("\n🧪 All assertions passed — transaction rolled back, live DB untouched.");
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Rolled back after failure:", err);
  process.exitCode = 1;
} finally {
  await client.end();
}
}

main();

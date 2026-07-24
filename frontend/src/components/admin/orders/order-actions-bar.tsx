"use client";

/**
 * OrderActionsBar — the action cluster shown on the order detail page.
 * Renders only the buttons that are valid for the current state.
 *
 *   - paid + unfulfilled     → Mark Shipped, Cancel, Refund
 *   - paid + shipped         → Mark Delivered, Refund
 *   - paid + fulfilled       → Refund only
 *   - refunded / cancelled   → no actions
 *
 * The "Mark Shipped" button opens a small inline form for carrier +
 * tracking. Refund opens a small inline form for amount + restock.
 */
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  markShippedAction,
  markDeliveredAction,
  cancelOrderAction,
  refundOrderAction,
} from "@/lib/actions/admin-orders";

interface AdminOrder {
  id: string;
  payment_status: string;
  fulfillment_status: string;
  total: number;
  currency: string;
}

type AdminCurrency = "USD" | "EUR" | "GBP" | "NGN" | "GHS" | "ZAR" | "KES";

export function OrderActionsBar({ order }: { order: AdminOrder }) {
  const [isPending, startTransition] = useTransition();
  const [shipForm, setShipForm] = useState(false);
  const [refundForm, setRefundForm] = useState(false);

  // Form state
  const [carrier, setCarrier] = useState("DHL");
  const [tracking, setTracking] = useState("");
  const [refundAmount, setRefundAmount] = useState(order.total);
  const [restock, setRestock] = useState(true);
  const [reason, setReason] = useState("");

  const canShip = order.payment_status === "paid" && order.fulfillment_status === "unfulfilled";
  const canDeliver = order.payment_status === "paid" && order.fulfillment_status !== "fulfilled" && order.fulfillment_status !== "cancelled";
  const canCancel = order.fulfillment_status !== "cancelled" && order.fulfillment_status !== "fulfilled";
  const canRefund =
    order.payment_status === "paid" || order.payment_status === "partially_refunded";

  if (!canShip && !canDeliver && !canCancel && !canRefund) {
    return null;
  }

  function call(action: () => Promise<{ data?: any; error?: string }>, label: string) {
    startTransition(async () => {
      try {
        const res = await action();
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`${label} — done.`);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <section className="border border-line bg-ivory p-4 space-y-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Actions</p>
      <div className="flex flex-wrap items-center gap-2">
        {canShip ? (
          <button
            type="button"
            onClick={() => setShipForm((v) => !v)}
            className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory"
          >
            {shipForm ? "Cancel" : "Mark Shipped"}
          </button>
        ) : null}
        {canDeliver ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => call(() => markDeliveredAction(order.id), "Marked delivered")}
            className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] border border-ink text-ink hover:bg-ink hover:text-ivory transition disabled:opacity-50"
          >
            Mark Delivered
          </button>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm("Cancel this order and release inventory?")) {
                call(() => cancelOrderAction(order.id), "Order cancelled");
              }
            }}
            className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink transition disabled:opacity-50"
          >
            Cancel order
          </button>
        ) : null}
        {canRefund ? (
          <button
            type="button"
            onClick={() => setRefundForm((v) => !v)}
            className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-ink underline underline-offset-4"
          >
            {refundForm ? "Cancel" : "Refund"}
          </button>
        ) : null}
      </div>

      {shipForm ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-line">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-1">Carrier</label>
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="h-10 w-full px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-1">Tracking #</label>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="h-10 w-full px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={isPending || !tracking}
              onClick={() => {
                call(
                  () => markShippedAction(order.id, { carrier, tracking_number: tracking }),
                  "Marked shipped",
                );
                setShipForm(false);
              }}
              className="h-10 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-50"
            >
              Confirm shipment
            </button>
          </div>
        </div>
      ) : null}

      {refundForm ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-line">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-1">Amount</label>
            <input
              type="number"
              min={0}
              max={order.total}
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="h-10 w-full px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-1">Reason (optional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 w-full px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone">
              <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="accent-ink" />
              Restock
            </label>
            <button
              type="button"
              disabled={isPending || refundAmount <= 0}
              onClick={() => {
                call(
                  () => refundOrderAction(order.id, { amount: refundAmount, restock, reason }),
                  "Refund issued",
                );
                setRefundForm(false);
              }}
              className="h-10 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-50"
            >
              Confirm refund
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

/**
 * SessionSync — reconciles the persisted client auth store with the real
 * server session once per page load. The `customer_token` cookie expires
 * after 30 days while the zustand mirror persists indefinitely; without
 * this, the UI shows a signed-in shopper whose every API call 401s.
 *
 * - Server has a session → refresh the local mirror (fresh loyalty points).
 * - Server has no session but the mirror says signed-in → clear it.
 * Renders nothing.
 */
import { useEffect } from "react";
import { useCustomerAuthStore, type CustomerUser } from "@/lib/store/customer-auth";
import { useHydrated } from "@/hooks/use-hydrated";

interface MeResponse {
  data?: { customer?: MeCustomer | null };
  customer?: MeCustomer | null;
}

interface MeCustomer {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  loyaltyPoints?: number | null;
  storeCreditUsd?: number | null;
}

function toStoreCustomer(c: MeCustomer): CustomerUser {
  return {
    id: c.id,
    email: c.email,
    firstName: c.firstName ?? undefined,
    lastName: c.lastName ?? undefined,
    loyaltyPoints: c.loyaltyPoints ?? undefined,
    storeCreditUsd: c.storeCreditUsd ?? undefined,
  };
}

export function SessionSync() {
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/customer/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled || !res.ok) return;
        const json = (await res.json().catch(() => null)) as MeResponse | null;
        // Authenticated responses use the backend envelope { data: { customer } };
        // the unauthenticated answer is the flat { customer: null }.
        const serverCustomer = json?.data?.customer ?? json?.customer ?? null;
        if (cancelled) return;

        const { customer, setCustomer, logout } = useCustomerAuthStore.getState();
        if (serverCustomer) {
          if (!customer || customer.id !== serverCustomer.id) {
            setCustomer(toStoreCustomer(serverCustomer));
          } else if (
            (serverCustomer.loyaltyPoints ?? null) !== (customer.loyaltyPoints ?? null) ||
            (serverCustomer.storeCreditUsd ?? null) !== (customer.storeCreditUsd ?? null)
          ) {
            setCustomer({ ...customer, ...toStoreCustomer(serverCustomer) });
          }
        } else if (customer) {
          logout();
        }
      } catch {
        // Network error — keep whatever local state we have.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  return null;
}

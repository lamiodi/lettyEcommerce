"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  loyaltyPoints?: number;
  storeCreditUsd?: number;
}

interface CustomerAuthState {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  setCustomer: (customer: CustomerUser | null) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      customer: null,
      isAuthenticated: false,
      setCustomer: (customer) =>
        set({
          customer,
          isAuthenticated: Boolean(customer),
        }),
      logout: () =>
        set({
          customer: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "letty-customer-auth",
    },
  ),
);

interface CheckoutAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  regionRequired: boolean;
  regionLabel: string;
  postalRequired: boolean;
}

export function getCheckoutFieldErrors(details: {
  email: string;
  shipping: CheckoutAddress;
  billing?: CheckoutAddress;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const email = details.email.trim();
  if (!email) errors.email = "Enter your email address for order confirmation.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address, such as name@example.com.";
  }

  const checkAddress = (address: CheckoutAddress, billing = false) => {
    const field = (key: string) => billing ? `billing${key[0].toUpperCase()}${key.slice(1)}` : key;
    const context = billing ? "billing " : "";
    for (const [key, label] of [["firstName", "first name"], ["lastName", "last name"], ["address", "street address"], ["city", "city"]] as const) {
      if (!address[key].trim()) errors[field(key)] = `Enter your ${context}${label}.`;
    }
    if (address.regionRequired && !address.state.trim()) {
      errors[field("state")] = `Select your ${context}${address.regionLabel.toLowerCase()}.`;
    }
    if (address.postalRequired && !address.postalCode.trim()) {
      errors[field("postalCode")] = `Enter your ${context}postal code / ZIP.`;
    }
  };
  checkAddress(details.shipping);
  if (details.billing) checkAddress(details.billing, true);
  return errors;
}

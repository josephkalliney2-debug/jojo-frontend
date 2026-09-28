/**
 * Paymob checkout flow (Egypt/MENA card + wallet payments).
 * Paymob's API is a 3-step handshake: authenticate -> create order ->
 * request a payment key -> redirect the customer to the iframe URL.
 *
 * Docs: https://docs.paymob.com/docs/accept-standard-redirect
 */

const PAYMOB_BASE = "https://accept.paymob.com/api";

interface PaymobCheckoutParams {
  amountCents: number;
  currency: string;
  email: string;
  companyName: string;
  subdomain: string; // passed through as merchant order metadata, read back in the webhook
}

async function paymobAuthenticate(): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  if (!res.ok) throw new Error(`Paymob auth failed: ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

async function paymobCreateOrder(
  authToken: string,
  amountCents: number,
  merchantOrderId: string
): Promise<number> {
  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: merchantOrderId,
      items: [],
    }),
  });
  if (!res.ok) throw new Error(`Paymob order creation failed: ${res.status}`);
  const data = await res.json();
  return data.id as number;
}

async function paymobRequestPaymentKey(
  authToken: string,
  orderId: number,
  amountCents: number,
  email: string,
  extra: Record<string, string>
): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        // Paymob requires these fields; "NA" placeholders are standard
        // practice for a SaaS signup flow with no physical shipping.
        apartment: "NA",
        email,
        floor: "NA",
        first_name: "NA",
        street: "NA",
        building: "NA",
        phone_number: "+00000000000",
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        country: "NA",
        last_name: "NA",
        state: "NA",
      },
      currency: "EGP",
      integration_id: process.env.PAYMOB_INTEGRATION_ID,
      // `extra` metadata is echoed back on the webhook's
      // `payment_key_claims.extra` — this is how the JOJO subdomain,
      // company name and email survive the round trip to Paymob and back.
      extra,
    }),
  });
  if (!res.ok) throw new Error(`Paymob payment key request failed: ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

/**
 * Runs the full Paymob handshake and returns the iframe URL to redirect
 * the customer to for payment.
 */
export async function createPaymobCheckoutUrl(params: PaymobCheckoutParams): Promise<string> {
  const { amountCents, email, companyName, subdomain } = params;

  const authToken = await paymobAuthenticate();
  const merchantOrderId = `jojo-${subdomain}-${Date.now()}`;
  const orderId = await paymobCreateOrder(authToken, amountCents, merchantOrderId);
  const paymentToken = await paymobRequestPaymentKey(authToken, orderId, amountCents, email, {
    company_name: companyName,
    subdomain,
    email,
  });

  return `${PAYMOB_BASE.replace("/api", "")}/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
}

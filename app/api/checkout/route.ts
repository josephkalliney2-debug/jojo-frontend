import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createPaymobCheckoutUrl } from "@/lib/paymob";

const SUBDOMAIN_RE = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

const CheckoutSchema = z.object({
  company_name: z.string().min(1).max(120),
  subdomain: z.string().regex(SUBDOMAIN_RE, "invalid subdomain format"),
  email: z.string().email(),
  payment_method: z.enum(["stripe", "paymob"]),
});

// Keep the monthly price in one place; Stripe uses its own Price object
// (STRIPE_PRICE_ID) so this is only needed for the Paymob amount, which
// Paymob requires in cents up front rather than referencing a stored price.
const PLAN_PRICE_USD = 49;
const PLACEHOLDER_USD_TO_EGP_RATE = 49; // TODO: replace with a real FX rate
// source (or just set a fixed EGP list price) before going live — this is
// a rough placeholder only so the Paymob flow has a concrete amount to send.
const PAYMOB_AMOUNT_CENTS = Math.round(PLAN_PRICE_USD * PLACEHOLDER_USD_TO_EGP_RATE * 100);

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  const { company_name, subdomain, email, payment_method } = parsed.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jojocloud.com";

  try {
    if (payment_method === "stripe") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
        customer_email: email,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout`,
        // This metadata is what the /api/webhooks/stripe route reads back
        // out of `checkout.session.completed` to build the Provisioner
        // request — company name, subdomain and email all have to survive
        // the round trip through Stripe.
        metadata: {
          company_name,
          subdomain,
          email,
        },
      });

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }

      return NextResponse.json({ checkout_url: session.url });
    }

    // payment_method === "paymob"
    const checkoutUrl = await createPaymobCheckoutUrl({
      amountCents: PAYMOB_AMOUNT_CENTS,
      currency: "EGP",
      email,
      companyName: company_name,
      subdomain,
    });

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again shortly." },
      { status: 502 }
    );
  }
}

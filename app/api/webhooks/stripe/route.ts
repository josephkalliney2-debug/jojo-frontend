import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { forwardToProvisioner } from "@/lib/provisioner";

// Stripe needs the RAW request body to verify the signature — Next.js's
// App Router route handlers give us that via req.text(), but only if we
// disable the default body parsing/caching behavior for this route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Ack anything we don't care about so Stripe stops retrying it.
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};
  const email = session.customer_details?.email || metadata.email;

  if (!metadata.subdomain || !metadata.company_name || !email) {
    // This should never happen if /api/checkout always sets metadata, but
    // fail loudly rather than silently dropping a paid signup.
    console.error("Stripe session missing required metadata:", session.id, metadata);
    return NextResponse.json(
      { error: "Session missing required metadata (subdomain/company_name/email)" },
      { status: 422 }
    );
  }

  const result = await forwardToProvisioner({
    client_name: metadata.company_name,
    email,
    subdomain_requested: metadata.subdomain,
    payment_reference: session.id,
  });

  if (!result.ok) {
    // Return a 5xx so Stripe retries the webhook — the Provisioner might be
    // mid-deploy or the subdomain race lost to a retry of this same event.
    console.error("Provisioner rejected the request:", result.status, result.body);
    return NextResponse.json(
      { error: "Provisioning failed", detail: result.body },
      { status: 502 }
    );
  }

  return NextResponse.json({ received: true, provisioned: result.body });
}

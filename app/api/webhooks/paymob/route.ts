import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { forwardToProvisioner } from "@/lib/provisioner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paymob's transaction-processed callback HMAC is computed over a fixed,
 * ordered concatenation of specific fields from `obj` (NOT the whole JSON
 * body) — see https://docs.paymob.com/docs/transaction-webhooks.
 * This field order matches Paymob's current docs for the "TRANSACTION"
 * callback; re-verify against their docs if you're on a different
 * integration type (e.g. token-based), since the field list differs.
 */
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function verifyPaymobHmac(obj: Record<string, unknown>, receivedHmac: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET || "";
  const concatenated = HMAC_FIELDS.map((field) => {
    const value = getNested(obj, field);
    return value === undefined || value === null ? "" : String(value);
  }).join("");

  const computed = crypto.createHmac("sha512", secret).update(concatenated).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedHmac));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const obj = body.obj as Record<string, unknown> | undefined;
  const receivedHmac = req.nextUrl.searchParams.get("hmac");

  if (!obj || !receivedHmac) {
    return NextResponse.json({ error: "Missing obj or hmac" }, { status: 400 });
  }

  if (!verifyPaymobHmac(obj, receivedHmac)) {
    console.error("Paymob HMAC verification failed for transaction", obj.id);
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
  }

  if (!obj.success) {
    return NextResponse.json({ received: true, ignored: "unsuccessful transaction" });
  }

  // The extra metadata we attached in lib/paymob.ts's payment_key request
  // comes back here under payment_key_claims.extra.
  const claims = (obj.payment_key_claims as Record<string, unknown>) || {};
  const extra = (claims.extra as Record<string, string>) || {};

  if (!extra.subdomain || !extra.company_name || !extra.email) {
    console.error("Paymob transaction missing required extra metadata:", obj.id, extra);
    return NextResponse.json(
      { error: "Transaction missing required metadata (subdomain/company_name/email)" },
      { status: 422 }
    );
  }

  const result = await forwardToProvisioner({
    client_name: extra.company_name,
    email: extra.email,
    subdomain_requested: extra.subdomain,
    payment_reference: String(obj.id),
  });

  if (!result.ok) {
    console.error("Provisioner rejected the request:", result.status, result.body);
    return NextResponse.json(
      { error: "Provisioning failed", detail: result.body },
      { status: 502 }
    );
  }

  return NextResponse.json({ received: true, provisioned: result.body });
}

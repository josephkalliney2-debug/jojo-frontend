/**
 * Single place where the Next.js backend talks to the Python Provisioner
 * (Step 3). Both the Stripe and Paymob webhook routes call this after
 * verifying their respective payment provider's signature — so tenant
 * creation logic lives in exactly one downstream service, not duplicated
 * per payment provider.
 */

interface ProvisionPayload {
  client_name: string;
  email: string;
  subdomain_requested: string;
  payment_reference?: string;
}

interface ProvisionResult {
  ok: boolean;
  status: number;
  body: unknown;
}

export async function forwardToProvisioner(payload: ProvisionPayload): Promise<ProvisionResult> {
  const url = `${process.env.PROVISIONER_INTERNAL_URL}/provision`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": process.env.PROVISIONER_INTERNAL_TOKEN || "",
    },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Provisioner may return an empty body on some error paths; that's fine.
  }

  return { ok: res.ok, status: res.status, body };
}

"use client";

import { useState, type FormEvent } from "react";

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "jojocloud.com";
const SUBDOMAIN_RE = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

type PaymentMethod = "stripe" | "paymob";

export default function CheckoutPage() {
  const [companyName, setCompanyName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subdomainSlug = subdomain.trim().toLowerCase().replace(/\s+/g, "-");
  const subdomainValid = subdomainSlug.length === 0 || SUBDOMAIN_RE.test(subdomainSlug);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!SUBDOMAIN_RE.test(subdomainSlug)) {
      setError("Subdomain must be 3-32 characters: lowercase letters, numbers, hyphens.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          subdomain: subdomainSlug,
          email,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Both Stripe Checkout and Paymob's iframe flow resolve to a URL to redirect to.
      window.location.href = data.checkout_url;
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-jojo-navy px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-jojo-navy">Create your JOJO Cloud workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Takes about a minute. You'll get your login by email right after payment.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
              Company name
            </label>
            <input
              id="companyName"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-jojo-orange focus:outline-none focus:ring-1 focus:ring-jojo-orange"
            />
          </div>

          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-slate-700">
              Desired subdomain
            </label>
            <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-jojo-orange focus-within:ring-1 focus-within:ring-jojo-orange">
              <input
                id="subdomain"
                required
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="acme"
                className="w-full px-3 py-2 text-sm focus:outline-none"
              />
              <span className="flex items-center whitespace-nowrap bg-slate-50 px-3 text-sm text-slate-500">
                .{DOMAIN}
              </span>
            </div>
            {!subdomainValid && (
              <p className="mt-1 text-xs text-red-600">
                Lowercase letters, numbers and hyphens only, 3-32 characters.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-jojo-orange focus:outline-none focus:ring-1 focus:ring-jojo-orange"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">Payment method</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(["stripe", "paymob"] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                    paymentMethod === method
                      ? "border-jojo-orange bg-orange-50 text-jojo-orange"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {method === "stripe" ? "Card (Stripe)" : "Paymob"}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-jojo-orange py-3 text-sm font-semibold text-white transition hover:bg-jojo-orange-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting to payment…" : "Continue to payment"}
          </button>
        </form>
      </div>
    </main>
  );
}

import Link from "next/link";

const FEATURES = [
  { title: "Accounting & Finance", desc: "Dynamic financial reports, invoicing, and full bookkeeping." },
  { title: "Payroll", desc: "Run payroll for your whole team, built on OCA's community payroll engine." },
  { title: "Contracts & Subscriptions", desc: "Manage recurring contracts and subscription billing." },
  { title: "Helpdesk", desc: "Ticketing and support pipelines for your customers." },
  { title: "Document Management", desc: "Centralized, searchable document storage." },
  { title: "Inventory & Barcode", desc: "Stock, logistics, and barcode scanning out of the box." },
];

export default function LandingPage() {
  return (
    <main>
      {/* --- Hero --- */}
      <section className="relative overflow-hidden bg-jojo-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(234,88,12,0.25),_transparent_55%)]" />
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="text-lg font-bold tracking-tight">
            JOJO <span className="text-jojo-orange">Cloud</span>
          </span>
          <Link
            href="/checkout"
            className="rounded-lg bg-jojo-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-jojo-orange-dark"
          >
            Start free trial
          </Link>
        </nav>

        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-16 text-center sm:pt-24">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
            JOJO Cloud — The Ultimate Cloud Business Suite
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Your own fully isolated ERP instance, live in minutes. Accounting, payroll,
            contracts, helpdesk, inventory — one subscription, unlimited users, zero
            infrastructure to manage.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/checkout"
              className="rounded-lg bg-jojo-orange px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-900/30 transition hover:bg-jojo-orange-dark"
            >
              Get your workspace
            </Link>
            <a
              href="#pricing"
              className="rounded-lg border border-slate-600 px-8 py-3 text-base font-semibold text-slate-200 transition hover:border-slate-400"
            >
              See pricing
            </a>
          </div>
        </div>
      </section>

      {/* --- Features --- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-jojo-navy sm:text-3xl">
          Everything Enterprise gives you. None of the license fees.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Built on Odoo Community Edition, extended with the OCA modules that replace
          every paid Enterprise app.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 p-6 transition hover:border-jojo-orange/50 hover:shadow-md"
            >
              <h3 className="font-semibold text-jojo-navy">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Pricing --- */}
      <section id="pricing" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-bold text-jojo-navy sm:text-3xl">Simple, unlimited pricing</h2>
          <p className="mt-3 text-slate-600">
            One plan. Unlimited users. Cancel anytime.
          </p>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border-2 border-jojo-orange bg-white p-8 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-jojo-orange">
              JOJO Cloud Standard
            </p>
            <p className="mt-4 flex items-end justify-center gap-1">
              <span className="text-5xl font-extrabold text-jojo-navy">$49</span>
              <span className="pb-1 text-slate-500">/ month</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">or $470/year — 2 months free</p>

            <ul className="mt-8 space-y-3 text-left text-sm text-slate-700">
              {[
                "Unlimited users",
                "Your own subdomain (yourcompany.jojocloud.com)",
                "All modules: accounting, payroll, contracts, helpdesk, DMS, inventory",
                "Automatic backups",
                "Free SSL certificate",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-jojo-orange">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout"
              className="mt-8 block w-full rounded-lg bg-jojo-orange py-3 text-center font-semibold text-white transition hover:bg-jojo-orange-dark"
            >
              Subscribe now
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} JOJO Cloud. All rights reserved.
      </footer>
    </main>
  );
}

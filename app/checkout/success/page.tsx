export default function CheckoutSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-jojo-navy px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <span className="text-2xl text-jojo-orange">✓</span>
        </div>
        <h1 className="mt-6 text-xl font-bold text-jojo-navy">Payment received</h1>
        <p className="mt-3 text-sm text-slate-600">
          We're setting up your workspace now — this usually takes about a minute.
          You'll get an email at the address you provided with your login URL and
          password as soon as it's ready.
        </p>
      </div>
    </main>
  );
}

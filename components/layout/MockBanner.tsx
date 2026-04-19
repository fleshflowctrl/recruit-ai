export function MockBanner() {
  const mock =
    process.env.NEXT_PUBLIC_TELNYX_MOCK === "true" ||
    process.env.TELNYX_MOCK === "true";
  if (!mock) return null;
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900">
      🔧 Mock modus actief — gesprekken worden gesimuleerd, geen echte
      telefoongesprekken
    </div>
  );
}

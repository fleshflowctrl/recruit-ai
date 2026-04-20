export function MockBanner() {
  const mock =
    process.env.NEXT_PUBLIC_TELNYX_MOCK === "true" ||
    process.env.TELNYX_MOCK === "true";
  if (!mock) return null;
  return (
    <div
      className="flex h-7 items-center border-b border-[rgba(122,92,16,0.2)] px-6 text-[11px] text-[color:var(--cream-yellow-text)]"
      style={{ background: "var(--cream-yellow)" }}
    >
      🔧 Mock modus actief — gesprekken worden gesimuleerd, geen echte
      telefoongesprekken
    </div>
  );
}

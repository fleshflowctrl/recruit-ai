export function MockBanner() {
  if (process.env.TELNYX_MOCK !== "true") return null;
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900">
      🔧 Mock modus actief — geen echte gesprekken
    </div>
  );
}

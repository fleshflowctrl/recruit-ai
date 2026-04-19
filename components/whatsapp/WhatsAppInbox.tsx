import { BerichtBubble } from "./BerichtBubble";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type B = {
  id: string;
  inhoud: string;
  richting: string;
  aangemaakt_op: string;
  kandidaten?: { naam?: string } | null;
};

export function WhatsAppInbox({ berichten }: { berichten: B[] }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h2 className="font-serif text-lg">WhatsApp inbox</h2>
      <div className="mt-4 flex max-h-[480px] flex-col gap-3 overflow-y-auto">
        {berichten.length === 0 && (
          <p className="text-sm text-muted">Geen berichten.</p>
        )}
        {berichten.map((b) => (
          <div key={b.id}>
            {b.kandidaten?.naam && (
              <p className="mb-1 text-xs font-medium text-muted">
                {b.kandidaten.naam}
              </p>
            )}
            <BerichtBubble
              richting={b.richting}
              inhoud={b.inhoud}
              tijd={format(new Date(b.aangemaakt_op), "PPp", { locale: nl })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

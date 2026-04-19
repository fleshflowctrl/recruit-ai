"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export function WhatsAppPanel({
  kandidaatId,
}: {
  kandidaatId: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const t = toast.loading("WhatsApp verzenden…");
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kandidaatId,
          message: text,
          type: "custom",
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Mislukt");
      setText("");
      toast.success("WhatsApp bericht verzonden.", { id: t });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Verzenden mislukt",
        { id: t },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg text-slate-900">WhatsApp</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Typ een bericht…"
        rows={3}
        className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={send}
        disabled={loading || !text.trim()}
        className="mt-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Verzenden…" : "Verstuur via WhatsApp"}
      </button>
    </div>
  );
}

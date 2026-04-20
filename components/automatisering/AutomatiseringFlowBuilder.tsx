"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lock, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { FlowOptionalStep, OptioneelStapKind } from "@/lib/automatisering-types";
import {
  DEFAULT_AI_BELLEN,
  DEFAULT_TRIGGER,
  DEFAULT_WHATSAPP,
  LIBRARY_BLOCKS,
  defaultOptionalSettings,
} from "@/lib/automatisering";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StepSettingsPanel, type PanelSelection } from "./StepSettingsPanel";

const DROP_ID = "flow-drop";

function Connector() {
  return (
    <div className="flex justify-center py-0.5" aria-hidden>
      <div className="h-6 w-px bg-border" />
    </div>
  );
}

function DashedConnector() {
  return (
    <div className="flex justify-center py-0.5" aria-hidden>
      <div className="h-6 w-px border-l border-dashed border-slate-300" />
    </div>
  );
}

function LibraryCard({
  block,
  disabled,
}: {
  block: (typeof LIBRARY_BLOCKS)[number];
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib-${block.kind}`,
    disabled,
    data: { type: "library", kind: block.kind },
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      disabled={disabled}
      className={cn(
        "flex w-full cursor-grab select-none items-start gap-3 rounded-xl border border-border bg-white p-3 text-left text-sm shadow-sm transition active:cursor-grabbing",
        disabled && "cursor-not-allowed opacity-40",
        isDragging && "opacity-50",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ring-1 ring-inset",
          block.chipClass,
        )}
        aria-hidden
      >
        {block.emoji}
      </span>
      <span className="min-w-0">
        <span className="font-medium text-slate-900">{block.naam}</span>
        <span className="mt-0.5 block text-xs text-muted">{block.subtitle}</span>
      </span>
    </button>
  );
}

function SortableRow({
  step,
  indexLabel,
  meta,
  onSelect,
  onToggle,
  onRemove,
}: {
  step: FlowOptionalStep;
  indexLabel: number;
  meta: (typeof LIBRARY_BLOCKS)[number];
  onSelect: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "z-10 opacity-80")}>
      <div
        className="flex items-stretch gap-2 rounded-xl border border-dashed border-slate-200 bg-white p-3 shadow-sm"
        {...attributes}
      >
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-muted hover:text-slate-900"
          aria-label="Verslepen"
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            {indexLabel}
          </span>
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ring-1 ring-inset",
              meta.chipClass,
            )}
            aria-hidden
          >
            {meta.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">{meta.naam}</p>
            <p className="text-xs text-muted">{meta.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={step.enabled}
                onChange={onToggle}
              />
              Actief
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="rounded-lg border border-border p-1.5 text-muted hover:bg-slate-50"
              aria-label="Instellingen"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="rounded-lg p-1.5 text-danger hover:bg-red-50"
              aria-label="Verwijderen"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropPlaceholder() {
  const { setNodeRef, isOver } = useDroppable({ id: DROP_ID });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted transition",
        isOver ? "border-primary bg-blue-50/50 text-primary" : "border-slate-300 bg-slate-50/80",
      )}
    >
      Sleep een stap hierheen om toe te voegen
    </div>
  );
}

function FixedStepRow({
  n,
  emoji,
  name,
  when,
  barClass,
  onClick,
}: {
  n: number;
  emoji: string;
  name: string;
  when: string;
  barClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-stretch gap-3 rounded-xl border border-border bg-slate-50/90 p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-100/90"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
        {n}
      </span>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg text-white shadow-inner",
          barClass,
        )}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-slate-900">{name}</span>
        <span className="mt-0.5 block text-xs text-muted">{when}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 self-center">
        <Lock className="h-4 w-4 text-warning" aria-hidden />
        <StatusBadge status="vast" />
      </span>
    </button>
  );
}

export function AutomatiseringFlowBuilder() {
  const [loading, setLoading] = useState(true);
  const [flow, setFlow] = useState<FlowOptionalStep[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({
    trigger: { ...DEFAULT_TRIGGER },
    ai_bellen: { ...DEFAULT_AI_BELLEN },
    whatsapp: { ...DEFAULT_WHATSAPP },
  });
  const [selection, setSelection] = useState<PanelSelection | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeDrag, setActiveDrag] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automatisering");
      const j = (await res.json()) as {
        flow?: FlowOptionalStep[];
        settings?: Record<string, unknown>;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Laden mislukt");
      const f = Array.isArray(j.flow) ? j.flow : [];
      setFlow(f);
      setSettings((prev) => ({
        ...prev,
        ...(j.settings ?? {}),
        trigger: { ...DEFAULT_TRIGGER, ...((j.settings?.trigger as object) ?? {}) },
        ai_bellen: { ...DEFAULT_AI_BELLEN, ...((j.settings?.ai_bellen as object) ?? {}) },
        whatsapp: { ...DEFAULT_WHATSAPP, ...((j.settings?.whatsapp as object) ?? {}) },
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Laden mislukt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const usedKinds = useMemo(() => new Set(flow.map((x) => x.kind)), [flow]);

  const totalStappen = 3 + flow.length;
  const actief = 3 + flow.filter((s) => s.enabled).length;

  function selectFixed(id: "trigger" | "ai_bellen" | "whatsapp") {
    setSelection({ t: "fixed", id });
    setPanelOpen(true);
  }

  function selectOptional(step: FlowOptionalStep) {
    setSelection({ t: "optional", stepId: step.id, kind: step.kind });
    setPanelOpen(true);
  }

  const onDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = e;
    if (!over) return;
    const aid = String(active.id);
    const oid = String(over.id);

    if (aid.startsWith("lib-")) {
      const kind = aid.replace("lib-", "") as OptioneelStapKind;
      if (usedKinds.has(kind)) return;
      const id = crypto.randomUUID();
      const row: FlowOptionalStep = { id, kind, enabled: true };
      if (oid === DROP_ID) {
        setFlow((prev) => [...prev, row]);
      } else {
        const ix = flow.findIndex((r) => r.id === oid);
        if (ix >= 0) {
          setFlow((prev) => {
            const n = [...prev];
            n.splice(ix, 0, row);
            return n;
          });
        } else {
          setFlow((prev) => [...prev, row]);
        }
      }
      setSettings((s) => ({ ...s, [id]: defaultOptionalSettings(kind) }));
      return;
    }

    if (flow.some((r) => r.id === aid) && flow.some((r) => r.id === oid)) {
      const oldIndex = flow.findIndex((r) => r.id === aid);
      const newIndex = flow.findIndex((r) => r.id === oid);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        setFlow(arrayMove(flow, oldIndex, newIndex));
      }
    }
  };

  async function saveAll() {
    setSaveLoading(true);
    const t = toast.loading("Opslaan…");
    try {
      const res = await fetch("/api/automatisering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow, settings }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Opslaan mislukt");
      toast.success("Flow opgeslagen ✓", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt", { id: t });
    } finally {
      setSaveLoading(false);
    }
  }

  function changeFixed(id: "trigger" | "ai_bellen" | "whatsapp", patch: Record<string, unknown>) {
    setSettings((s) => ({ ...s, [id]: patch }));
  }

  function changeOptionalFull(
    stepId: string,
    _kind: OptioneelStapKind,
    value: Record<string, unknown>,
  ) {
    setSettings((s) => ({ ...s, [stepId]: value }));
  }

  if (loading) {
    return <p className="text-sm text-muted">Flow laden…</p>;
  }

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveDrag(String(e.active.id))}
        onDragEnd={onDragEnd}
      >
        <div className="flex min-h-[560px] flex-col gap-4 lg:flex-row lg:gap-0">
          {/* Library */}
          <aside className="w-full shrink-0 border-border pt-2 lg:w-[220px] lg:border-r lg:pt-0 lg:pr-4">
            <h3 className="mb-3 font-serif text-sm font-semibold text-slate-800">Beschikbare stappen</h3>
            <div className="flex max-h-[min(420px,50vh)] flex-col gap-2 overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
              {LIBRARY_BLOCKS.map((b) => (
                <LibraryCard key={b.kind} block={b} disabled={usedKinds.has(b.kind)} />
              ))}
            </div>
          </aside>

          {/* Canvas */}
          <div className="min-w-0 flex-1 border-border pt-2 lg:border-r lg:px-4 lg:pt-0">
            <h3 className="mb-3 font-serif text-sm font-semibold text-slate-800">Jouw flow</h3>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <FixedStepRow
                n={1}
                emoji="🎯"
                name="Trigger"
                when="Campagne gestart of vacature aangemaakt"
                barClass="bg-blue-600"
                onClick={() => selectFixed("trigger")}
              />
              <Connector />
              <FixedStepRow
                n={2}
                emoji="📞"
                name="AI belt kandidaten"
                when="Automatisch screenen in het Nederlands"
                barClass="bg-success"
                onClick={() => selectFixed("ai_bellen")}
              />
              <Connector />
              <FixedStepRow
                n={3}
                emoji="💬"
                name="WhatsApp bevestiging"
                when="Jobinfo automatisch na plaatsing"
                barClass="bg-violet-600"
                onClick={() => selectFixed("whatsapp")}
              />

              <div className="relative my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
                  Optionele stappen
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <SortableContext items={flow.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0">
                  {flow.map((step, i) => {
                    const meta = LIBRARY_BLOCKS.find((b) => b.kind === step.kind);
                    if (!meta) return null;
                    return (
                      <div key={step.id}>
                        {i > 0 ? <DashedConnector /> : null}
                        <SortableRow
                          step={step}
                          indexLabel={4 + i}
                          meta={meta}
                          onSelect={() => selectOptional(step)}
                          onToggle={() =>
                            setFlow((prev) =>
                              prev.map((r) =>
                                r.id === step.id ? { ...r, enabled: !r.enabled } : r,
                              ),
                            )
                          }
                          onRemove={() => {
                            setFlow((prev) => prev.filter((r) => r.id !== step.id));
                            setSettings((s) => {
                              const n = { ...s };
                              delete n[step.id];
                              return n;
                            });
                            if (selection?.t === "optional" && selection.stepId === step.id) {
                              setPanelOpen(false);
                              setSelection(null);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>

              {flow.length > 0 ? <DashedConnector /> : null}
              <div className="mt-2">
                <DropPlaceholder />
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  {actief} van {totalStappen} stappen actief
                </p>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={saveAll}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>

          {/* Settings — desktop */}
          <div
            className={cn(
              "hidden w-[280px] shrink-0 overflow-hidden transition-[max-width,opacity] duration-200 lg:block",
              panelOpen ? "max-w-[280px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            {panelOpen && selection ?
              <div className="h-full min-h-[560px]">
                <StepSettingsPanel
                  selection={selection}
                  settings={settings}
                  onChangeFixed={changeFixed}
                  onChangeOptionalFull={changeOptionalFull}
                  onClose={() => {
                    setPanelOpen(false);
                    setSelection(null);
                  }}
                />
              </div>
            : null}
          </div>
        </div>

        {/* Mobile bottom sheet */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-white shadow-2xl transition-transform duration-200 md:hidden",
            panelOpen ? "translate-y-0" : "translate-y-full pointer-events-none",
          )}
        >
          {panelOpen && selection ?
            <StepSettingsPanel
              selection={selection}
              settings={settings}
              onChangeFixed={changeFixed}
              onChangeOptionalFull={changeOptionalFull}
              onClose={() => {
                setPanelOpen(false);
                setSelection(null);
              }}
            />
          : null}
        </div>

        <DragOverlay>
          {activeDrag?.startsWith("lib-") ?
            (() => {
              const k = activeDrag.replace("lib-", "") as OptioneelStapKind;
              const b = LIBRARY_BLOCKS.find((x) => x.kind === k);
              if (!b) return null;
              return (
                <div className="pointer-events-none flex items-start gap-3 rounded-xl border border-border bg-white p-3 text-left text-sm shadow-lg">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ring-1 ring-inset",
                      b.chipClass,
                    )}
                  >
                    {b.emoji}
                  </span>
                  <span>
                    <span className="font-medium">{b.naam}</span>
                  </span>
                </div>
              );
            })()
          : null}
        </DragOverlay>
      </DndContext>
  );
}

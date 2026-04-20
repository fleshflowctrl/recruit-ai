"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
import { StepSettingsPanel, type PanelSelection } from "./StepSettingsPanel";

const DROP_ID = "flow-drop";

const creamWrapperStyle: CSSProperties = {
  ["--cream-bg" as string]: "#FAFAF8",
  ["--cream-surface" as string]: "#F5F4F0",
  ["--cream-raised" as string]: "#EFEDE8",
  ["--cream-border" as string]: "rgba(0,0,0,0.08)",
  ["--cream-border-md" as string]: "rgba(0,0,0,0.13)",
  ["--cream-border-str" as string]: "rgba(0,0,0,0.20)",
  ["--cream-text" as string]: "#1A1A18",
  ["--cream-muted" as string]: "#8A8A85",
  ["--cream-faint" as string]: "#B0AFA9",
  ["--cream-accent" as string]: "#3D3D3A",
  ["--cream-blue" as string]: "#D4E4F7",
  ["--cream-green" as string]: "#D4EDD8",
  ["--cream-yellow" as string]: "#F5EBC8",
  ["--cream-purple" as string]: "#E8E0F5",
  ["--cream-pink" as string]: "#F5DDE0",
  ["--cream-orange" as string]: "#F5E4CE",
  ["--cream-red" as string]: "#F5D9D9",
  background: "var(--cream-bg)",
  fontFamily: "-apple-system, system-ui, sans-serif",
  borderRadius: 12,
};

const fixedChip = {
  trigger: "var(--cream-blue)",
  ai: "var(--cream-green)",
  whatsapp: "var(--cream-purple)",
} as const;

const PASTEL_BY_KIND: Record<OptioneelStapKind, string> = {
  no_show: "var(--cream-yellow)",
  beschikbaarheid: "var(--cream-purple)",
  check_in: "var(--cream-pink)",
  uren: "var(--cream-orange)",
  evaluatie: "var(--cream-blue)",
  dagrapport: "var(--cream-green)",
  ziekte: "var(--cream-red)",
};

const border1 = { border: "1px solid var(--cream-border)" };

function Connector() {
  return (
    <div className="py-0.5" aria-hidden>
      <div
        className="ml-[55px] h-5 w-px shrink-0"
        style={{ background: "var(--cream-border-md)" }}
      />
    </div>
  );
}

function DashedConnector() {
  return (
    <div
      className="ml-[55px] h-5 shrink-0 border-l"
      style={{ borderLeftWidth: 1, borderLeftStyle: "dashed", borderLeftColor: "var(--cream-border-md)" }}
      aria-hidden
    />
  );
}

function CreamToggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className="relative h-5 w-9 shrink-0 cursor-pointer p-0 transition-colors duration-200"
      style={{
        borderRadius: 10,
        border: enabled ? "none" : "1px solid var(--cream-border-md)",
        background: enabled ? "#5C8A5C" : "var(--cream-raised)",
      }}
    >
      <span
        className="pointer-events-none absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white transition-[left] duration-150"
        style={{
          left: enabled ? 19 : 3,
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      />
    </button>
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
  const bg = PASTEL_BY_KIND[block.kind];
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      disabled={disabled}
      style={{
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        background: "var(--cream-bg)",
        ...border1,
        transition: "border-color 150ms, background 150ms",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#ffffff";
          e.currentTarget.style.borderColor = "var(--cream-border-md)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--cream-bg)";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
      }}
      className={cn(
        "flex w-full cursor-grab select-none items-center text-left active:cursor-grabbing",
        disabled && "cursor-not-allowed opacity-30",
        isDragging && "opacity-50",
      )}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center text-sm"
        style={{ borderRadius: 8, background: bg }}
        aria-hidden
      >
        {block.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-tight" style={{ fontSize: 13, color: "var(--cream-text)" }}>
          {block.naam}
        </span>
        <span className="mt-0.5 block leading-snug" style={{ fontSize: 11, color: "var(--cream-muted)" }}>
          {block.subtitle}
        </span>
      </span>
    </button>
  );
}

function SortableRow({
  step,
  indexLabel,
  bgEmoji,
  onSelect,
  onToggle,
  onRemove,
}: {
  step: FlowOptionalStep;
  indexLabel: number;
  bgEmoji: string;
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
        className={cn(
          "flex items-center gap-3 py-3 pl-[14px] pr-[14px] transition-all duration-150",
          !step.enabled && "opacity-40",
        )}
        style={{
          borderRadius: 8,
          border: "1px dashed var(--cream-border-md)",
          background: "var(--cream-bg)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--cream-surface)";
          e.currentTarget.style.borderColor = "var(--cream-border-str)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--cream-bg)";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.13)";
        }}
        {...attributes}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-0.5 transition-colors"
          style={{ fontSize: 14, color: "var(--cream-faint)", padding: "0 2px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--cream-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--cream-faint)";
          }}
          aria-label="Verslepen"
          {...listeners}
        >
          ⋮⋮
        </button>
        <span
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center font-semibold"
          style={{
            fontSize: 11,
            borderRadius: "50%",
            background: "var(--cream-raised)",
            color: "var(--cream-muted)",
            ...border1,
            borderStyle: "solid",
          }}
        >
          {indexLabel}
        </span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center text-[15px]"
          style={{ borderRadius: 8, background: bgEmoji }}
          aria-hidden
        >
          {LIBRARY_BLOCKS.find((b) => b.kind === step.kind)?.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight" style={{ fontSize: 14, color: "var(--cream-text)" }}>
            {LIBRARY_BLOCKS.find((b) => b.kind === step.kind)?.naam}
          </p>
          <p className="mt-px leading-snug" style={{ fontSize: 12, color: "var(--cream-muted)" }}>
            {LIBRARY_BLOCKS.find((b) => b.kind === step.kind)?.subtitle}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <CreamToggle
            enabled={step.enabled}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex items-center justify-center transition-colors"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              ...border1,
              background: "transparent",
              color: "var(--cream-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--cream-raised)";
              e.currentTarget.style.color = "var(--cream-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--cream-muted)";
            }}
            aria-label="Instellingen"
          >
            <Pencil style={{ width: 13, height: 13 }} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex items-center justify-center text-xs transition-colors"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              ...border1,
              background: "transparent",
              color: "var(--cream-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--cream-red)";
              e.currentTarget.style.borderColor = "rgba(180,60,60,0.2)";
              e.currentTarget.style.color = "#8B2020";
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, border1);
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--cream-muted)";
            }}
            aria-label="Verwijderen"
          >
            ✕
          </button>
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
      className="mt-3 px-4 py-4 text-center transition-all duration-150"
      style={{
        borderRadius: 8,
        borderWidth: "1.5px",
        borderStyle: "dashed",
        borderColor: isOver ? "rgba(0,0,0,0.25)" : "var(--cream-border-md)",
        background: isOver ? "var(--cream-raised)" : "transparent",
        fontSize: 13,
        color: isOver ? "var(--cream-muted)" : "var(--cream-faint)",
      }}
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
  chipBg,
  onOpenSettings,
}: {
  n: number;
  emoji: string;
  name: string;
  when: string;
  chipBg: string;
  onOpenSettings: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenSettings}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenSettings();
        }
      }}
      className="flex cursor-pointer items-center gap-3 py-3 pl-[14px] pr-[14px] transition-all duration-150"
      style={{
        borderRadius: 8,
        ...border1,
        background: "var(--cream-surface)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--cream-raised)";
        e.currentTarget.style.borderColor = "var(--cream-border-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--cream-surface)";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
      }}
    >
      <span
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center font-semibold"
        style={{
          fontSize: 11,
          borderRadius: "50%",
          background: "var(--cream-yellow)",
          color: "#7A6A1A",
        }}
      >
        {n}
      </span>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[15px]"
        style={{ borderRadius: 8, background: chipBg }}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-tight" style={{ fontSize: 14, color: "var(--cream-text)" }}>
          {name}
        </span>
        <span className="mt-px block leading-snug" style={{ fontSize: 12, color: "var(--cream-muted)" }}>
          {when}
        </span>
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <Lock style={{ width: 13, height: 13, color: "var(--cream-faint)" }} aria-hidden />
        <span
          className="whitespace-nowrap"
          style={{
            fontSize: 10,
            color: "var(--cream-faint)",
            background: "var(--cream-raised)",
            ...border1,
            padding: "1px 6px",
            borderRadius: 20,
          }}
        >
          vast
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          className="flex items-center justify-center transition-colors"
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            ...border1,
            background: "transparent",
            color: "var(--cream-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--cream-raised)";
            e.currentTarget.style.color = "var(--cream-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--cream-muted)";
          }}
          aria-label="Instellingen"
        >
          <Pencil style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
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
    return (
      <div className="p-4 sm:p-6" style={creamWrapperStyle}>
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--cream-muted)",
            fontSize: 13,
          }}
        >
          Flow laden…
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6" style={creamWrapperStyle}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveDrag(String(e.active.id))}
        onDragEnd={onDragEnd}
      >
        <div className="flex min-h-[560px] flex-col gap-4 lg:flex-row lg:gap-4">
          <aside
            className="w-full shrink-0 p-4 lg:w-[220px]"
            style={{
              borderRadius: 10,
              ...border1,
              background: "var(--cream-surface)",
            }}
          >
            <h3
              className="mb-3 font-semibold uppercase tracking-[0.1em]"
              style={{ fontSize: 10, color: "var(--cream-faint)" }}
            >
              Beschikbare stappen
            </h3>
            <div className="flex max-h-[min(420px,50vh)] flex-col gap-2 overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
              {LIBRARY_BLOCKS.map((b) => (
                <LibraryCard key={b.kind} block={b} disabled={usedKinds.has(b.kind)} />
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <h3
              className="mb-3 font-semibold uppercase tracking-[0.1em]"
              style={{ fontSize: 10, color: "var(--cream-faint)" }}
            >
              Jouw flow
            </h3>
            <div
              className="p-5"
              style={{
                borderRadius: 10,
                ...border1,
                background: "var(--cream-bg)",
              }}
            >
              <FixedStepRow
                n={1}
                emoji="🎯"
                name="Trigger"
                when="Campagne gestart of vacature aangemaakt"
                chipBg={fixedChip.trigger}
                onOpenSettings={() => selectFixed("trigger")}
              />
              <Connector />
              <FixedStepRow
                n={2}
                emoji="📞"
                name="AI belt kandidaten"
                when="Automatisch screenen in het Nederlands"
                chipBg={fixedChip.ai}
                onOpenSettings={() => selectFixed("ai_bellen")}
              />
              <Connector />
              <FixedStepRow
                n={3}
                emoji="💬"
                name="WhatsApp bevestiging"
                when="Jobinfo automatisch na plaatsing"
                chipBg={fixedChip.whatsapp}
                onOpenSettings={() => selectFixed("whatsapp")}
              />

              <div className="flex items-center gap-2" style={{ margin: "16px 0 10px 52px" }}>
                <span
                  className="shrink-0 font-semibold uppercase tracking-[0.1em]"
                  style={{ fontSize: 10, color: "var(--cream-faint)" }}
                >
                  Optionele stappen
                </span>
                <span className="h-px flex-1" style={{ background: "var(--cream-border)" }} />
              </div>

              <SortableContext items={flow.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div>
                  {flow.map((step, i) => {
                    const meta = LIBRARY_BLOCKS.find((b) => b.kind === step.kind);
                    if (!meta) return null;
                    return (
                      <div key={step.id}>
                        {i > 0 ? <DashedConnector /> : null}
                        <SortableRow
                          step={step}
                          indexLabel={4 + i}
                          bgEmoji={PASTEL_BY_KIND[step.kind]}
                          onSelect={() => selectOptional(step)}
                          onToggle={() =>
                            setFlow((prev) =>
                              prev.map((r) => (r.id === step.id ? { ...r, enabled: !r.enabled } : r)),
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
              <DropPlaceholder />

              <div
                className="mt-5 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderTop: "1px solid var(--cream-border)" }}
              >
                <p style={{ fontSize: 13, color: "var(--cream-muted)" }}>
                  {actief} van {totalStappen} stappen actief
                </p>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={saveAll}
                  className="cursor-pointer font-medium transition-opacity duration-150 hover:opacity-[0.85] disabled:opacity-50"
                  style={{
                    padding: "8px 22px",
                    fontSize: 13,
                    borderRadius: 8,
                    background: "var(--cream-text)",
                    color: "var(--cream-bg)",
                    border: "none",
                  }}
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "hidden shrink-0 overflow-hidden transition-[max-width,opacity] duration-200 lg:block",
              panelOpen ? "max-w-[260px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            {panelOpen && selection ?
              <div className="min-h-[560px] w-[260px]">
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

        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto transition-transform duration-200 md:hidden",
            panelOpen ? "translate-y-0" : "pointer-events-none translate-y-full",
          )}
          style={{
            borderTop: "1px solid var(--cream-border)",
            borderLeft: "1px solid var(--cream-border)",
            borderRight: "1px solid var(--cream-border)",
            borderRadius: "10px 10px 0 0",
            background: "var(--cream-bg)",
          }}
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
                <div
                  className="pointer-events-none flex items-center gap-2.5 py-2.5 pl-3 pr-3.5 text-left"
                  style={{
                    background: "#ffffff",
                    borderRadius: 8,
                    border: "1px solid var(--cream-border-md)",
                    gap: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-sm"
                    style={{ borderRadius: 8, background: PASTEL_BY_KIND[k] }}
                  >
                    {b.emoji}
                  </span>
                  <span className="font-medium" style={{ fontSize: 13, color: "var(--cream-text)" }}>
                    {b.naam}
                  </span>
                </div>
              );
            })()
          : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

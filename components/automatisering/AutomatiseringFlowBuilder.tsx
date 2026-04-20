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
import { StepSettingsPanel, type PanelSelection } from "./StepSettingsPanel";

const DROP_ID = "flow-drop";

const pastels = {
  trigger: "#DBEAFE",
  ai: "#DCFCE7",
  whatsapp: "#F3E8FF",
} as const;

const PASTEL_BY_KIND: Record<OptioneelStapKind, string> = {
  no_show: "#FEF9C3",
  beschikbaarheid: "#F3E8FF",
  check_in: "#FFE4E6",
  uren: "#FED7AA",
  evaluatie: "#DBEAFE",
  dagrapport: "#DCFCE7",
  ziekte: "#FEE2E2",
};

const borderTertiary = { border: "0.5px solid var(--color-border-tertiary)" };

function Connector() {
  return (
    <div className="py-[3px]" aria-hidden>
      <div
        className="ml-[60px] h-[20px] w-[1.5px] shrink-0 rounded-full"
        style={{ background: "var(--color-border-tertiary)" }}
      />
    </div>
  );
}

function DashedConnector() {
  return <div className="flow-dashed-connector" aria-hidden />;
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
        ...borderTertiary,
        borderRadius: "var(--border-radius-md)",
        background: "var(--color-background-primary)",
        gap: 10,
        padding: "10px 12px",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = "var(--color-border-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-tertiary)";
      }}
      className={cn(
        "flex w-full cursor-grab select-none items-center text-left transition-colors active:cursor-grabbing",
        disabled && "cursor-not-allowed opacity-[0.3]",
        isDragging && "opacity-50",
      )}
    >
      <span
        className="flex h-[28px] w-[28px] shrink-0 items-center justify-center text-[14px]"
        style={{ borderRadius: 8, background: bg }}
        aria-hidden
      >
        {block.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block font-medium leading-tight"
          style={{ fontSize: 13, color: "var(--color-text-primary)" }}
        >
          {block.naam}
        </span>
        <span
          className="mt-0.5 block leading-snug"
          style={{ fontSize: 11, color: "var(--color-text-secondary)" }}
        >
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
          "flex items-center gap-3 py-3 pl-4 pr-4 transition-colors",
          !step.enabled && "opacity-[0.45]",
        )}
        style={{
          border: "0.5px dashed var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          background: "var(--color-background-primary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-tertiary)";
        }}
        {...attributes}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-0.5"
          style={{ fontSize: 14, color: "var(--color-text-secondary)" }}
          aria-label="Verslepen"
          {...listeners}
        >
          ⋮⋮
        </button>
        <span
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center font-medium"
          style={{
            fontSize: 11,
            borderRadius: "50%",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-secondary)",
            ...borderTertiary,
            borderStyle: "solid",
          }}
        >
          {indexLabel}
        </span>
        <span
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center text-base"
          style={{ borderRadius: 8, background: bgEmoji }}
          aria-hidden
        >
          {LIBRARY_BLOCKS.find((b) => b.kind === step.kind)?.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight" style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
            {LIBRARY_BLOCKS.find((b) => b.kind === step.kind)?.naam}
          </p>
          <p className="mt-0.5 leading-snug" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {LIBRARY_BLOCKS.find((b) => b.kind === step.kind)?.subtitle}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={step.enabled}
            data-state={step.enabled ? "on" : "off"}
            className="flow-toggle"
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
              ...borderTertiary,
              background: "transparent",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-background-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
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
            className="flex items-center justify-center text-[12px] transition-colors"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              ...borderTertiary,
              background: "transparent",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-background-danger)";
              e.currentTarget.style.borderColor = "var(--color-border-danger)";
              e.currentTarget.style.color = "var(--color-text-danger)";
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, borderTertiary);
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-secondary)";
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
      className="mt-2.5 px-[14px] py-[14px] text-center transition-colors"
      style={{
        borderRadius: "var(--border-radius-md)",
        borderWidth: "1.5px",
        borderStyle: "dashed",
        borderColor: isOver ? "var(--color-border-info)" : "var(--color-border-tertiary)",
        background: isOver ? "var(--color-background-info)" : "transparent",
        fontSize: 13,
        color: isOver ? "var(--color-text-info)" : "var(--color-text-secondary)",
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
      className="flex cursor-pointer items-center gap-3 py-3 pl-4 pr-4 transition-colors"
      style={{
        ...borderTertiary,
        borderRadius: "var(--border-radius-md)",
        background: "var(--color-background-secondary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-tertiary)";
      }}
    >
      <span
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center font-medium"
        style={{
          fontSize: 11,
          borderRadius: "50%",
          background: "var(--color-background-warning)",
          color: "var(--color-text-warning)",
        }}
      >
        {n}
      </span>
      <span
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center text-base"
        style={{ borderRadius: 8, background: chipBg }}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-tight" style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
          {name}
        </span>
        <span className="mt-0.5 block leading-snug" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {when}
        </span>
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <Lock style={{ width: 14, height: 14, color: "var(--color-text-secondary)" }} aria-hidden />
        <span className="whitespace-nowrap" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
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
            ...borderTertiary,
            background: "transparent",
            color: "var(--color-text-secondary)",
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-background-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
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
      <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
        Flow laden…
      </p>
    );
  }

  return (
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
            ...borderTertiary,
            borderRadius: "var(--border-radius-lg)",
            background: "var(--color-background-secondary)",
          }}
        >
          <h3
            className="mb-3 font-medium uppercase tracking-[0.08em]"
            style={{ fontSize: 11, color: "var(--color-text-secondary)" }}
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
            className="mb-3 font-medium uppercase tracking-[0.08em]"
            style={{ fontSize: 11, color: "var(--color-text-secondary)" }}
          >
            Jouw flow
          </h3>
          <div
            className="p-5"
            style={{
              ...borderTertiary,
              background: "var(--color-background-primary)",
              borderRadius: "var(--border-radius-lg)",
            }}
          >
            <FixedStepRow
              n={1}
              emoji="🎯"
              name="Trigger"
              when="Campagne gestart of vacature aangemaakt"
              chipBg={pastels.trigger}
              onOpenSettings={() => selectFixed("trigger")}
            />
            <Connector />
            <FixedStepRow
              n={2}
              emoji="📞"
              name="AI belt kandidaten"
              when="Automatisch screenen in het Nederlands"
              chipBg={pastels.ai}
              onOpenSettings={() => selectFixed("ai_bellen")}
            />
            <Connector />
            <FixedStepRow
              n={3}
              emoji="💬"
              name="WhatsApp bevestiging"
              when="Jobinfo automatisch na plaatsing"
              chipBg={pastels.whatsapp}
              onOpenSettings={() => selectFixed("whatsapp")}
            />

            <div className="flex items-center gap-2" style={{ margin: "14px 0 10px 48px" }}>
              <span
                className="shrink-0 font-medium uppercase tracking-wide"
                style={{ fontSize: 10, color: "var(--color-text-secondary)" }}
              >
                Optionele stappen
              </span>
              <span className="h-[0.5px] flex-1" style={{ background: "var(--color-border-tertiary)" }} />
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
              style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}
            >
              <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                {actief} van {totalStappen} stappen actief
              </p>
              <button
                type="button"
                disabled={saveLoading}
                onClick={saveAll}
                className="cursor-pointer font-medium disabled:opacity-60"
                style={{
                  padding: "8px 20px",
                  fontSize: 13,
                  borderRadius: "var(--border-radius-md)",
                  background: "var(--color-background-info)",
                  color: "var(--color-text-info)",
                  ...borderTertiary,
                  borderColor: "var(--color-border-info)",
                  borderStyle: "solid",
                  borderWidth: 0.5,
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
          ...borderTertiary,
          borderBottomWidth: 0,
          borderRadius: "var(--border-radius-lg) var(--border-radius-lg) 0 0",
          background: "var(--color-background-primary)",
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
                className="pointer-events-none flex items-center gap-2.5 py-2.5 pl-3 pr-3 text-left"
                style={{
                  ...borderTertiary,
                  borderRadius: "var(--border-radius-md)",
                  background: "var(--color-background-primary)",
                  gap: 10,
                }}
              >
                <span
                  className="flex h-[28px] w-[28px] shrink-0 items-center justify-center text-[14px]"
                  style={{ borderRadius: 8, background: PASTEL_BY_KIND[k] }}
                >
                  {b.emoji}
                </span>
                <span className="font-medium" style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
                  {b.naam}
                </span>
              </div>
            );
          })()
        : null}
      </DragOverlay>
    </DndContext>
  );
}

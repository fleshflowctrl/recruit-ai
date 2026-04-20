import { cn } from "@/lib/utils";

export function BerichtBubble({
  richting,
  inhoud,
  tijd,
}: {
  richting: string;
  inhoud: string;
  tijd: string;
}) {
  const outbound = richting === "outbound";
  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
          outbound
            ? "bg-[color:var(--cream-text)] text-[color:var(--cream-bg)]"
            : "bg-[color:var(--cream-raised)] text-[color:var(--cream-text)]",
        )}
      >
        <p>{inhoud}</p>
        <p className={cn("mt-1 text-[10px] opacity-70")}>{tijd}</p>
      </div>
    </div>
  );
}

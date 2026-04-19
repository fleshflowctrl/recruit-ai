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
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-900",
        )}
      >
        <p>{inhoud}</p>
        <p className={cn("mt-1 text-[10px] opacity-70")}>{tijd}</p>
      </div>
    </div>
  );
}

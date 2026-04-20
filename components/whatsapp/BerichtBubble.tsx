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
    <div
      className={cn(
        "flex max-w-[72%] flex-col",
        outbound ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div
        className={cn(
          "max-w-full whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-[13px] leading-[1.5]",
          outbound
            ? "rounded-br-[4px] bg-[#1A1A18] text-[#F5F4F0]"
            : "rounded-bl-[4px] border border-[rgba(0,0,0,0.08)] bg-white text-[#1A1A18]",
        )}
      >
        {inhoud}
      </div>
      <p className="mt-0.5 font-mono text-[10px] text-[#B0AFA9]">{tijd}</p>
    </div>
  );
}

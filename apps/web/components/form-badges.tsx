const COLORS: Record<string, string> = {
  W: "bg-signal/80 text-black",
  D: "bg-white/20 text-white",
  L: "bg-red-500/70 text-white",
};

export function FormBadges({ form }: { form: string[] }) {
  if (!form.length) return <span className="text-white/30">—</span>;
  return (
    <span className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
            COLORS[r] ?? "bg-white/10"
          }`}
        >
          {r}
        </span>
      ))}
    </span>
  );
}

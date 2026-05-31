/** Recent form as W/D/L chips, matching the design's .fdot styling. */
export function FormDots({ form }: { form: string[] }) {
  if (!form.length) return <span className="dim">—</span>;
  return (
    <span className="form-row">
      {form.map((r, i) => (
        <span key={i} className={`fdot ${r.toLowerCase()}`}>
          {r}
        </span>
      ))}
    </span>
  );
}

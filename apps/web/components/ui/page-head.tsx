export function PageHead({
  eyebrow,
  title,
  sub,
  actions,
  center,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`page-head reveal${center ? " center" : ""}`}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {actions && <div className="flex gap-10 aic wrap">{actions}</div>}
    </div>
  );
}

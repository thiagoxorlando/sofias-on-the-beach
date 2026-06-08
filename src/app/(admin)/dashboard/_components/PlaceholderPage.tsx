export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="p-6 md:p-10">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold text-admin-sidebar-act uppercase tracking-[0.28em] mb-1.5">
          {eyebrow}
        </p>
        <h1 className="text-[26px] md:text-[32px] font-bold text-slate-800 leading-tight mb-3">
          {title}
        </h1>
        <p className="text-[14px] text-foreground/55 leading-relaxed mb-8">
          {description}
        </p>
        <div className="inline-flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3">
          <ConstructionIcon />
          <span className="text-[13px] font-medium">Funcionalidade em construção</span>
        </div>
      </div>
    </div>
  )
}

function ConstructionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M2 20h20" />
      <path d="M6 20V10l6-6 6 6v10" />
      <path d="M12 4v6" />
      <path d="M10 20v-5h4v5" />
    </svg>
  )
}

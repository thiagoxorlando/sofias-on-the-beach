export function BookingWidget() {
  return (
    <div className="bg-background py-0 px-6 md:px-10 -mt-1">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card border border-sand-200 rounded-2xl shadow-md p-3">

          {/* Desktop: horizontal row */}
          <div className="hidden md:flex items-stretch gap-1">
            <WidgetField label="Check-in" placeholder="Selecione a data" />
            <div className="w-px bg-border self-stretch my-2" />
            <WidgetField label="Check-out" placeholder="Selecione a data" />
            <div className="w-px bg-border self-stretch my-2" />
            <WidgetField label="Hóspedes" placeholder="2 adultos" />
            <button
              type="button"
              className="bg-primary text-primary-foreground px-8 py-3 m-1 rounded-xl font-semibold text-sm hover:bg-ocean-700 transition-colors shadow-sm whitespace-nowrap self-stretch"
            >
              Ver disponibilidade
            </button>
          </div>

          {/* Mobile: stacked */}
          <div className="md:hidden flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <MobileField label="Check-in" placeholder="Chegada" />
              <MobileField label="Check-out" placeholder="Saída" />
            </div>
            <MobileField label="Hóspedes" placeholder="2 adultos" />
            <button
              type="button"
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-sm hover:bg-ocean-700 transition-colors shadow-sm"
            >
              Ver disponibilidade
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WidgetField({
  label,
  placeholder,
}: {
  label: string
  placeholder: string
}) {
  return (
    <div className="flex-1 px-5 py-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer min-w-0">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-muted-foreground/60">{placeholder}</p>
    </div>
  )
}

function MobileField({
  label,
  placeholder,
}: {
  label: string
  placeholder: string
}) {
  return (
    <div className="bg-muted/40 rounded-xl px-4 py-3 border border-border">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-muted-foreground/60">{placeholder}</p>
    </div>
  )
}

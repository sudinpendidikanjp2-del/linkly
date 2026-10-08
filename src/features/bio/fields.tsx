import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function Field({ label, hint, error, htmlFor, children, className, labelAction }: { label: ReactNode; hint?: ReactNode; error?: string; htmlFor?: string; children: ReactNode; className?: string; labelAction?: ReactNode }) {
  const { te } = useI18n();
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className={cn(error && "text-destructive-text")}>
          {label}
        </Label>
        {labelAction}
      </div>
      {children}
      {hint ? <p className="text-[13px] text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-destructive-text">
          {te(error)}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ label, value, onChange, error, hint, placeholder, maxLength, inputMode, type = "text" }: { label: ReactNode; value: string; onChange: (value: string) => void; error?: string; hint?: ReactNode; placeholder?: string; maxLength?: number; inputMode?: "url" | "text"; type?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} aria-invalid={Boolean(error)} autoComplete="off" autoCapitalize="off" spellCheck={false} />
    </Field>
  );
}

export function UrlField(props: Omit<Parameters<typeof TextField>[0], "inputMode" | "placeholder">) {
  return <TextField {...props} inputMode="url" placeholder="https://" />;
}

export function ColorField({ label, value, onChange, fallback }: { label: ReactNode; value: string | undefined; onChange: (value: string | undefined) => void; fallback: string }) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value ?? fallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
        />
        <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-[13px]">{value ?? fallback}</code>
        {value ? (
          <button type="button" className="press rounded-md px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none" onClick={() => onChange(undefined)}>
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SliderField({ label, value, onChange, min, max, step = 1, unit = "", hint }: { label: ReactNode; value: number; onChange: (value: number) => void; min: number; max: number; step?: number; unit?: string; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label id={id}>{label}</Label>
        <span className="tabular rounded-md bg-muted px-2 py-0.5 text-[13px] font-medium">
          {value}
          {unit}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} aria-labelledby={id} />
      {hint ? <p className="text-[13px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ChoiceField<T extends string>({ label, value, onChange, options }: { label: ReactNode; value: T; onChange: (value: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label id={id}>{label}</Label>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ToggleGroup type="single" value={value} onValueChange={(next) => next && onChange(next as T)} aria-labelledby={id}>
          {options.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}

export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

"use client";

export function MemoryToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <span className={`text-sm font-semibold ${value ? "text-emerald-700" : "text-neutral-500"}`}>
        Memory {value ? "ON" : "OFF"}
      </span>
      <button
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative h-8 w-14 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-neutral-300"}`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${value ? "left-7" : "left-1"}`}
        />
      </button>
    </label>
  );
}

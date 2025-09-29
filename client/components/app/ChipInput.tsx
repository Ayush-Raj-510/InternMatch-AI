import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ChipInput({
  value,
  onChange,
  placeholder,
  inputId = 'chip-input',
}: {
  value: string[];
  onChange: (chips: string[]) => void;
  placeholder?: string;
  inputId?: string;
}) {
  const [text, setText] = useState("");

  function addChip() {
    const v = text.trim();
    if (!v) return;
    if (value.includes(v.toLowerCase())) return setText("");
    onChange([...value, v.toLowerCase()]);
    setText("");
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((chip) => (
          <button
            key={chip}
            onClick={() => onChange(value.filter((c) => c !== chip))}
            className="group inline-flex items-center gap-1 rounded-full border bg-amber-50 px-2.5 py-1 text-sm text-amber-900 hover:bg-amber-100"
            aria-label={`Remove ${chip}`}
          >
            <span>{chip}</span>
            <X className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addChip();
            }
          }}
          placeholder={placeholder}
          data-i18n-placeholder={placeholder ? undefined : 'chip.placeholder'}
        />
        <button
          type="button"
          onClick={addChip}
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          data-i18n="button.add"
        >
          Add
        </button>
      </div>
    </div>
  );
}

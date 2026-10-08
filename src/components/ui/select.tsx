"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; icon?: React.ReactNode };

type Pos = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

/**
 * Dropdown bertema pengganti <select> bawaan browser.
 * Panel dirender via portal (tidak terpotong modal) dan panah berputar saat dibuka/tutup.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [active, setActive] = useState(-1);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback(() => setOpen(false), []);

  const measure = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const below = window.innerHeight - r.bottom - gap - 12;
    const above = r.top - gap - 12;
    const flip = below < 200 && above > below;
    setPos(
      flip
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + gap, maxHeight: Math.min(288, above) }
        : { left: r.left, width: r.width, top: r.bottom + gap, maxHeight: Math.min(288, below) }
    );
  }, []);

  useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && active >= 0) panelRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function toggle() {
    if (disabled) return;
    if (open) return close();
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  }

  function pick(v: string) {
    onChange(v);
    close();
    btnRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[active]) pick(options[active].value);
    } else if (e.key === "Tab") {
      close();
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={cn(
          "input flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-fuchsia-500/60 bg-white/[0.06] ring-4 ring-fuchsia-500/10",
          className
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2.5", !selected && "text-white/30")}>
          {selected?.icon}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-white/50 transition-transform duration-300", open && "rotate-180 text-fuchsia-300")} />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            role="listbox"
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
            className={cn(
              "glass-strong fixed z-[300] overflow-y-auto overscroll-contain rounded-2xl p-1.5 shadow-2xl shadow-black/60 animate-dropdown",
              pos.bottom !== undefined ? "origin-bottom" : "origin-top"
            )}
          >
            {options.length === 0 && <p className="px-3 py-2.5 text-sm text-white/40">Tidak ada pilihan</p>}
            {options.map((o, i) => {
              const isSel = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  data-i={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    isSel ? "bg-gradient-to-r from-violet-600/25 to-fuchsia-600/10 text-white" : "text-white/75",
                    active === i && !isSel && "bg-white/[0.06] text-white"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {o.icon}
                    <span className="min-w-0 break-words">{o.label}</span>
                  </span>
                  {isSel && <Check className="size-4 shrink-0 text-fuchsia-300" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

"use client";

// Link ke section di halaman yang sama: scroll mulus tanpa menambah "#" di URL.
export function ScrollLink({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${id}`}
      className={className}
      onClick={(e) => {
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 64), behavior: "smooth" });
      }}
    >
      {children}
    </a>
  );
}

import Link from "next/link";

interface LinedButtonProps {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  children: React.ReactNode;
  tone?: "ink" | "ivory";
  width?: string;
  disabled?: boolean;
}

/**
 * Template-matching "lined" button — horizontal rules above and below the
 * label, centered, with a constrained max-width. Used site-wide to keep the
 * luxury template's quiet, editorial button treatment consistent.
 */
export function LinedButton({
  href,
  onClick,
  type = "button",
  className = "",
  children,
  tone = "ink",
  width = "max-w-[200px]",
  disabled = false,
}: LinedButtonProps) {
  const hrClass = tone === "ivory" ? "border-ivory/30" : "border-ink/30";
  const textClass = tone === "ivory" ? "text-ivory hover:text-white" : "text-ink hover:text-stone";

  const inner = (
    <div className={`w-full flex flex-col items-center ${width} ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <hr className={`w-full ${hrClass}`} />
      <span
        className={`w-full py-2.5 text-[11px] font-medium text-center tracking-widest uppercase transition-colors ${textClass}`}
      >
        {children}
      </span>
      <hr className={`w-full ${hrClass}`} />
    </div>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className="inline-block">
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-block">
      {inner}
    </button>
  );
}

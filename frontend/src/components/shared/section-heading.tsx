import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/** Editorial section header: uppercase eyebrow, serif title, gold hairline. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        centered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-luxe text-gold">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-3xl font-medium text-ink md:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h2>
      <span aria-hidden className={cn("rule-gold h-px w-24", centered ? "mx-auto" : "")} />
      {description && (
        <p className="max-w-xl text-sm leading-relaxed text-stone md:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

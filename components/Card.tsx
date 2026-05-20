import Link from "next/link";

type Props = {
  href: string;
  title: string;
  description: string;
  badge?: string;
};

export function Card({ href, title, description, badge }: Props) {
  return (
    <Link
      href={href}
      className="surface surface-hover block p-6 no-underline"
    >
      {badge && (
        <span className="mb-3 inline-block rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]">
          {badge}
        </span>
      )}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
        {description}
      </p>
    </Link>
  );
}

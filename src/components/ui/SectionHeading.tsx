import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  actions,
  level = 2,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  actions?: ReactNode;
  level?: 1 | 2;
}) {
  const HeadingTag = level === 1 ? 'h1' : 'h2';
  return (
    <div className={align === 'center' ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-green/70">{eyebrow}</p>
      ) : null}
      <HeadingTag className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</HeadingTag>
      {description ? <p className="mt-4 text-base leading-7 text-slate-600">{description}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

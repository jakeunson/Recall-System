import React from 'react';

interface PageHeaderProps {
  badgeText: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent' | 'secondary' | 'muted';
  title: string;
  description: string;
}

export default function PageHeader({ badgeText, badgeType = 'success', title, description }: PageHeaderProps) {
  return (
    <section className="bg-secondary border border-border rounded-md px-7 py-6">
      <div className="flex items-center gap-2 mb-2">
        <span className={`badge badge-${badgeType} text-sm`}>{badgeText}</span>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[700px]">
        {description}
      </p>
    </section>
  );
}

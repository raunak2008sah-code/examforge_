import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-meta"
                style={{
                  color: 'var(--text-secondary)',
                  transition: 'color var(--motion-fast)',
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-meta"
                style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}

            {!isLast && <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

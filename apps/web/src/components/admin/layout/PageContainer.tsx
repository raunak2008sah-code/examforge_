import React from 'react';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="container-admin">{children}</div>;
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Upload,
  Activity,
  CheckSquare,
  Database,
  BarChart2,
  Settings,
  ShieldAlert,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Exams', href: '/admin/exams', icon: FileText },
  { name: 'Uploads', href: '/admin/uploads', icon: Upload },
  { name: 'Parser Queue', href: '/admin/parser-queue', icon: Activity },
  { name: 'Review Queue', href: '/admin/review-queue', icon: CheckSquare },
  { name: 'Question Bank', href: '/admin/question-bank', icon: Database },
  { name: 'Results', href: '/admin/results', icon: BarChart2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps = {}) {
  const pathname = usePathname();

  return (
    <>
      <div className="admin-sidebar-header">ExamForge Admin</div>
      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`admin-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
        active
          ? "text-gray-900 bg-neutral-100 font-bold"
          : "text-neutral-500 hover:text-gray-900 hover:bg-neutral-100"
      } ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

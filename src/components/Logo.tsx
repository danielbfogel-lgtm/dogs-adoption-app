import Link from "next/link";
import { Dog } from "lucide-react";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <Dog className="h-7 w-7 text-primary" aria-hidden="true" />
      <span className="text-lg font-bold tracking-tight">Dog Adoption</span>
    </Link>
  );
}

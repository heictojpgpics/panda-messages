import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <span
        className="relative grid place-items-center rounded-2xl bg-jade-soft ring-1 ring-jade/20 overflow-hidden"
        style={{ width: size, height: size }}
      >
        { }
        <img
          src="/panda/d-center.png"
          alt=""
          width={size}
          height={size}
          className="w-[86%] h-[86%] object-contain drop-shadow-sm"
          draggable={false}
        />
      </span>
      <span className="font-display font-semibold text-ink text-[1.18rem] leading-none tracking-tight">
        Panda<span className="text-jade"> Messages</span>
      </span>
    </span>
  );
}

export function LogoLink({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="Panda Messages home" className="group">
      <span className="group-hover:-translate-y-0.5 transition-transform inline-block">
        <Logo />
      </span>
    </Link>
  );
}

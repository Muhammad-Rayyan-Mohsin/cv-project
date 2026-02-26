"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Github, LayoutDashboard, User } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
] as const;

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none">
      <nav className="mt-4 mx-4 flex items-center gap-1 px-2 h-12 rounded-2xl border border-white/[0.06] bg-zinc-950/60 backdrop-blur-2xl shadow-[0_2px_24px_rgba(0,0,0,0.4)] pointer-events-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 pl-2 pr-3 h-8 rounded-xl hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 4 L14 4 L20 10 L20 20 L4 20 Z" fill="white" fillOpacity="0.9" />
              <path d="M14 4 L14 10 L20 10 Z" fill="white" fillOpacity="0.45" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight hidden sm:block">
            CV Tailor
          </span>
        </Link>

        {/* Separator */}
        {status !== "loading" && session && (
          <div className="w-px h-4 bg-white/[0.06] mx-1" />
        )}

        {/* Nav links — only when authenticated */}
        {status !== "loading" && session && (
          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-medium transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-white/[0.08]"
                      transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                    />
                  )}
                  <Icon
                    className={`relative w-3.5 h-3.5 ${isActive ? "text-orange-400" : "text-zinc-500"}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`relative hidden sm:block ${isActive ? "text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Separator */}
        {status !== "loading" && (
          <div className="w-px h-4 bg-white/[0.06] mx-1" />
        )}

        {/* Right section */}
        {status === "loading" ? (
          <div className="w-7 h-7 rounded-full bg-zinc-800/60 animate-pulse mx-1" />
        ) : session ? (
          <div className="flex items-center gap-1">
            {/* Avatar */}
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user?.name || "Avatar"}
                className="w-7 h-7 rounded-full ring-1 ring-white/[0.06]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full ring-1 ring-white/[0.06] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                {session.user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("github")}
            className="flex items-center gap-1.5 px-3.5 h-8 rounded-xl bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors"
          >
            <Github className="w-3.5 h-3.5" strokeWidth={2} />
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}

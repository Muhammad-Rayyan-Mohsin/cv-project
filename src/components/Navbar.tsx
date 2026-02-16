"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard, Github, UserCircle } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_16px_rgba(249,115,22,0.25)] group-hover:shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-shadow">
              {/* Folded paper / origami abstract mark */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4 L20 4 L20 20 L4 20 Z" fill="white" fillOpacity="0.25" />
                <path d="M4 4 L14 4 L20 10 L20 20 L4 20 Z" fill="white" fillOpacity="0.9" />
                <path d="M14 4 L14 10 L20 10 Z" fill="white" fillOpacity="0.5" />
              </svg>
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">
              CV Tailor
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
                >
                  <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
                >
                  <UserCircle className="w-4 h-4" strokeWidth={1.5} />
                  Profile
                </Link>
                <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                  <img
                    src={session.user?.image || ""}
                    alt=""
                    className="w-7 h-7 rounded-full ring-1 ring-white/10"
                  />
                  <span className="text-zinc-400 text-sm hidden sm:block">
                    {session.user?.name}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-full hover:bg-white/5"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("github")}
                className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full font-medium text-sm hover:bg-zinc-100 transition-colors"
              >
                <Github className="w-4 h-4" strokeWidth={2} />
                Sign in
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

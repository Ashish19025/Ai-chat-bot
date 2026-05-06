"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Chat page has its own full-screen layout — no navbar needed
  if (pathname === "/chat") return null;

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-black/60 border-b border-white/10">
      <Link href="/" className="text-xl font-bold text-green-400 tracking-tight">
        SaaS AI
      </Link>

      <div className="flex items-center gap-5">
        <Link href="/" className="text-gray-300 hover:text-green-400 transition text-sm font-medium">
          Home
        </Link>
        <Link href="/" className="text-gray-300 hover:text-green-400 transition text-sm font-medium">
          Features
        </Link>

        {user ? (
          <>
            <Link href="/chat" className="text-gray-300 hover:text-green-400 transition text-sm font-medium">
              Chat
            </Link>
            <span className="text-gray-500 text-sm hidden md:block truncate max-w-[160px]">
              {user.email}
            </span>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-lg hover:bg-red-500/20 transition text-sm font-medium"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-gray-300 hover:text-green-400 transition text-sm font-medium border border-gray-700 px-4 py-1.5 rounded-lg hover:border-green-500"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-green-500 text-black text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-green-400 transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

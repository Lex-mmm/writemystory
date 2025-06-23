"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-blue-600 text-white px-6 py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          writemystory.ai
        </Link>
        <nav className="space-x-6 text-sm sm:text-base font-medium">
          <Link href="/how-it-works" className="hover:underline">Hoe het werkt</Link>
          <Link href="/start" className="hover:underline">Begin</Link>
          <Link href="/about" className="hover:underline">Over ons</Link>
          <Link href="/login" className="hover:underline">Inloggen</Link>
          <Link href="/signup" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
            Aanmelden
          </Link>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 py-8 mt-12 border-t">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        <p className="text-center sm:text-left">
          © {new Date().getFullYear()} WriteMyStory.ai — Jullie vertellen, wij schrijven.
        </p>
        <nav className="flex space-x-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/how-it-works" className="hover:underline">Hoe het werkt</Link>
          <Link href="/faq" className="hover:underline">FAQ</Link>
          <Link href="/start" className="hover:underline">Begin</Link>
          <Link href="/about" className="hover:underline">Over ons</Link>
          <Link href="/login" className="hover:underline">Inloggen</Link>
          <Link href="/signup" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
            Aanmelden
          </Link>
        </nav>
      </div>
    </footer>
  );
}

// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMsg("Er is een fout opgetreden bij het inloggen.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inloggen</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          ← Terug naar home
        </Link>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="E-mailadres"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Wachtwoord"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {errorMsg && <p className="text-red-500">{errorMsg}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          disabled={isLoading}
        >
          {isLoading ? "Bezig met inloggen..." : "Inloggen"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Nog geen account?{" "}
        <Link href="/signup" className="text-blue-600 underline">
          Registreer hier
        </Link>
        .
      </p>
      <p className="mt-2 text-sm text-gray-600">
        <Link href="/forgot-password" className="text-blue-600 underline">
          Wachtwoord vergeten?
        </Link>
      </p>
    </main>
  );
}
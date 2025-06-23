'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setMessage('Wachtwoorden komen niet overeen.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Wachtwoord succesvol gewijzigd.');
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setMessage('Er is een fout opgetreden.');
      setIsSuccess(false);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Wachtwoord opnieuw instellen</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          ← Terug naar home
        </Link>
      </div>
      <form onSubmit={handleResetPassword} className="space-y-4">
        <input
          type="password"
          placeholder="Nieuw wachtwoord"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Bevestig nieuw wachtwoord"
          className="w-full border p-2 rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {message && (
          <p className={`${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Bezig...' : 'Wachtwoord wijzigen'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 underline">
          Terug naar inloggen
        </Link>
      </p>
    </main>
  );
}
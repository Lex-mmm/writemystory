'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Controleer uw e-mail voor de reset link.');
        setIsSuccess(true);
        setEmail('');
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
        <h1 className="text-2xl font-bold">Wachtwoord vergeten</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          ← Terug naar home
        </Link>
      </div>
      <form onSubmit={handleResetPassword} className="space-y-4">
        <p className="text-gray-600 mb-4">
          Voer uw e-mailadres in en we sturen u een link om uw wachtwoord te resetten.
        </p>
        <input
          type="email"
          placeholder="E-mailadres"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          {isLoading ? 'Bezig...' : 'Reset wachtwoord'}
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
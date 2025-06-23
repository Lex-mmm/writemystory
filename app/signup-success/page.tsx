'use client';

import Link from 'next/link';

export default function SignupSuccessPage() {
  return (
    <main className="max-w-md mx-auto px-6 py-12 text-center">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Registratie succesvol!</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          ← Terug naar home
        </Link>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <p className="text-green-800 mb-4">
          Er is een bevestigingslink naar uw e-mailadres verzonden. Klik op de link in uw e-mail om uw account te activeren.
        </p>
        <p className="text-gray-600 text-sm">
          Als u de e-mail niet kunt vinden, controleer dan uw spam of ongewenste e-mail.
        </p>
      </div>
      <Link href="/login" className="text-blue-600 underline">
        Ga naar inloggen
      </Link>
    </main>
  );
}
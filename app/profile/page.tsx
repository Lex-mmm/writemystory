'use client';

import { useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: name 
        }
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Profiel bijgewerkt!');
        setIsSuccess(true);
      }
    } catch (err) {
      setMessage('Er is een fout opgetreden.');
      setIsSuccess(false);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setMessage('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Controleer uw e-mail voor de reset link.');
        setIsSuccess(true);
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
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mijn Profiel</h1>
          <Link 
            href="/dashboard"
            className="text-blue-600 hover:underline"
          >
            Terug naar dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Informatie</h2>
          
          <div className="mb-4">
            <p className="text-gray-500 text-sm mb-1">E-mailadres</p>
            <p className="font-medium">{user?.email}</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="name">
                Volledige naam
              </label>
              <input
                id="name"
                type="text"
                placeholder="Uw volledige naam"
                className="w-full border p-2 rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {message && (
              <p className={`${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={isLoading}
              >
                {isLoading ? 'Bijwerken...' : 'Profiel bijwerken'}
              </button>
              
              <button
                type="button"
                onClick={handlePasswordReset}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded"
                disabled={isLoading}
              >
                Wachtwoord wijzigen
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Privacy en Voorkeuren</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications"
                className="mr-2"
              />
              <label htmlFor="email-notifications">
                E-mailnotificaties ontvangen
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="whatsapp-notifications"
                className="mr-2"
              />
              <label htmlFor="whatsapp-notifications">
                WhatsApp notificaties ontvangen
              </label>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
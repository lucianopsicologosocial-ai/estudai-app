import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6557', fontFamily: 'sans-serif' }}>
        Carregando...
      </div>
    );
  }

  return session ? <Dashboard session={session} /> : <Auth />;
}

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import RedefinirSenha from './pages/RedefinirSenha';

export default function App() {
  const [session, setSession] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecuperando(true);
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

  if (recuperando) return <RedefinirSenha onConcluir={() => setRecuperando(false)} />;

  return session ? <Dashboard session={session} /> : <Auth />;
}

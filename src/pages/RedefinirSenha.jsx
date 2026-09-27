import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Lock, Loader2 } from 'lucide-react';

export default function RedefinirSenha({ onConcluir }) {
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== confirmar) return setErro('As senhas não conferem.');
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) return setErro('Não foi possível alterar a senha. O link pode ter expirado; peça um novo em "Esqueci minha senha".');
    setOk(true);
  };

  const card = { width: '100%', maxWidth: 400, background: '#FFFEFA', border: '1px solid #E0D9C6', borderRadius: 14, padding: '36px 32px', boxShadow: '0 8px 30px rgba(42,68,57,0.08)' };
  const field = { display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E0D9C6', borderRadius: 8, padding: '11px 14px', marginBottom: 14 };
  const input = { border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' };
  const btn = { width: '100%', background: '#3D5A4C', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#F7F4ED 0%,#E4EBE6 100%)', padding: 20, fontFamily: "'Source Sans Pro','Segoe UI',sans-serif" }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <BookOpen size={26} color="#3D5A4C" />
          <span style={{ fontFamily: "'Source Serif Pro',Georgia,serif", fontSize: 24, fontWeight: 700, color: '#2A4439' }}>Estudaí</span>
        </div>
        {ok ? (
          <>
            <p style={{ color: '#2A4439', fontSize: 14, margin: '12px 0 20px' }}>Senha alterada com sucesso! ✅</p>
            <button style={btn} onClick={onConcluir}>Continuar</button>
          </>
        ) : (
          <>
            <p style={{ color: '#6B6557', fontSize: 13.5, margin: '0 0 24px' }}>Crie uma nova senha para a sua conta.</p>
            {erro && <div style={{ background: '#FBEAE6', color: '#8B3A2F', fontSize: 12.5, padding: '10px 12px', borderRadius: 7, marginBottom: 14 }}>{erro}</div>}
            <form onSubmit={handleSubmit}>
              <div style={field}><Lock size={16} color="#6B6557" /><input style={input} type="password" placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} /></div>
              <div style={field}><Lock size={16} color="#6B6557" /><input style={input} type="password" placeholder="Confirme a nova senha" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required minLength={6} /></div>
              <button type="submit" style={btn} disabled={carregando}>{carregando && <Loader2 size={16} />}Salvar nova senha</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

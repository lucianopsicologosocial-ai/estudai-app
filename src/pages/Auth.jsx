import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function Auth() {
  const [modo, setModo] = useState('login'); // login | cadastro | recuperar
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setCarregando(true);
    try {
      if (modo === 'recuperar') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMensagem('Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.');
      } else if (modo === 'cadastro') {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { full_name: nome } },
        });
        if (error) throw error;
        setMensagem('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
    } catch (err) {
      setErro(traduzErro(err.message));
    } finally {
      setCarregando(false);
    }
  };

  const traduzErro = (msg) => {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado. Tente entrar.';
    if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (msg.includes('Unable to validate email')) return 'E-mail inválido.';
    if (msg.toLowerCase().includes('rate limit') || msg.includes('For security purposes')) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
    return msg;
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F7F4ED 0%, #E4EBE6 100%);
          padding: 20px;
          font-family: 'Source Sans Pro', 'Segoe UI', sans-serif;
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: #FFFEFA;
          border: 1px solid #E0D9C6;
          border-radius: 14px;
          padding: 36px 32px;
          box-shadow: 0 8px 30px rgba(42, 68, 57, 0.08);
        }
        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .auth-logo span {
          font-family: 'Source Serif Pro', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #2A4439;
        }
        .auth-subtitle {
          color: #6B6557;
          font-size: 13.5px;
          margin: 0 0 28px;
        }
        .auth-tabs {
          display: flex;
          gap: 4px;
          background: #F7F4ED;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .auth-tabs button {
          flex: 1;
          border: none;
          background: none;
          padding: 9px;
          font-size: 13px;
          font-weight: 600;
          color: #6B6557;
          border-radius: 6px;
          cursor: pointer;
        }
        .auth-tabs button.active {
          background: #FFFEFA;
          color: #2A4439;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .auth-field {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #E0D9C6;
          border-radius: 8px;
          padding: 11px 14px;
          margin-bottom: 14px;
          background: #FFFEFA;
        }
        .auth-field svg { color: #6B6557; flex-shrink: 0; }
        .auth-field input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
          background: transparent;
          color: #2A2620;
        }
        .auth-submit {
          width: 100%;
          background: #3D5A4C;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
        }
        .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-erro {
          background: #FBEAE6;
          color: #8B3A2F;
          font-size: 12.5px;
          padding: 10px 12px;
          border-radius: 7px;
          margin-bottom: 14px;
        }
        .auth-mensagem {
          background: #E4EBE6;
          color: #2A4439;
          font-size: 12.5px;
          padding: 10px 12px;
          border-radius: 7px;
          margin-bottom: 14px;
        }
        .auth-link {
          background: none;
          border: none;
          color: #3D5A4C;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin: 14px auto 0;
          display: block;
          text-decoration: underline;
        }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="auth-card">
        <div className="auth-logo">
          <BookOpen size={26} color="#3D5A4C" />
          <span>Estudaí</span>
        </div>
        <p className="auth-subtitle">Leitura dinâmica, formatação ABNT e progresso nos estudos, tudo em um só lugar.</p>

        {modo === 'recuperar' && (
          <p className="auth-subtitle" style={{ marginTop: -12 }}>Digite o e-mail da sua conta para receber o link de redefinição de senha.</p>
        )}

        <div className="auth-tabs" style={modo === 'recuperar' ? { display: 'none' } : undefined}>
          <button className={modo === 'login' ? 'active' : ''} onClick={() => { setModo('login'); setErro(''); setMensagem(''); }}>Entrar</button>
          <button className={modo === 'cadastro' ? 'active' : ''} onClick={() => { setModo('cadastro'); setErro(''); setMensagem(''); }}>Criar conta</button>
        </div>

        {erro && <div className="auth-erro">{erro}</div>}
        {mensagem && <div className="auth-mensagem">{mensagem}</div>}

        <form onSubmit={handleSubmit}>
          {modo === 'cadastro' && (
            <div className="auth-field">
              <User size={16} />
              <input type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
          )}
          <div className="auth-field">
            <Mail size={16} />
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {modo !== 'recuperar' && (
            <div className="auth-field">
              <Lock size={16} />
              <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
            </div>
          )}
          <button type="submit" className="auth-submit" disabled={carregando}>
            {carregando && <Loader2 size={16} className="spin" />}
            {modo === 'login' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : 'Enviar link de recuperação'}
          </button>
        </form>

        {modo === 'login' && (
          <button type="button" className="auth-link" onClick={() => { setModo('recuperar'); setErro(''); setMensagem(''); }}>
            Esqueci minha senha
          </button>
        )}
        {modo === 'recuperar' && (
          <button type="button" className="auth-link" onClick={() => { setModo('login'); setErro(''); setMensagem(''); }}>
            Voltar para o login
          </button>
        )}
      </div>
    </div>
  );
}

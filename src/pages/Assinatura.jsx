import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react';

export default function Assinatura({ session }) {
  const [nome, setNome] = useState(session?.user?.user_metadata?.full_name || '');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [linkPagamento, setLinkPagamento] = useState('');

  const assinar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const resp = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email: session.user.email,
          cpfCnpj: cpfCnpj.replace(/\D/g, ''),
          plano: 'estudai_mensal',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Não foi possível criar a assinatura.');

      await supabase.from('subscriptions').insert({
        user_id: session.user.id,
        status: 'trialing',
        plan: 'estudai_mensal',
        mercado_pago_subscription_id: data.subscriptionId,
      });

      if (data.invoiceUrl) {
        setLinkPagamento(data.invoiceUrl);
        window.open(data.invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="assinatura-painel">
      <style>{`
        .assinatura-painel { max-width: 480px; margin: 0 auto; }
        .assinatura-painel h2 { font-family: 'Source Serif Pro', Georgia, serif; font-size: 22px; margin-bottom: 8px; color: #2A2620; }
        .assinatura-painel p.sub { color: #6B6557; font-size: 13.5px; margin-bottom: 24px; }
        .assinatura-preco { background: #E4EBE6; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px; text-align: center; }
        .assinatura-preco .valor { font-size: 28px; font-weight: 800; color: #2A4439; font-family: 'Source Serif Pro', Georgia, serif; }
        .assinatura-preco .periodo { color: #6B6557; font-size: 13px; }
        .assinatura-form label { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; font-weight: 600; color: #6B6557; margin-bottom: 14px; }
        .assinatura-form input { font-size: 14px; padding: 10px 12px; border: 1px solid #E0D9C6; border-radius: 7px; background: #FFFEFA; color: #2A2620; }
        .assinatura-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #3D5A4C; color: #fff; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .assinatura-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .assinatura-erro { background: #FBEAE6; color: #8B3A2F; font-size: 12.5px; padding: 10px 12px; border-radius: 7px; margin-bottom: 14px; }
        .assinatura-sucesso { background: #E4EBE6; color: #2A4439; font-size: 13px; padding: 14px; border-radius: 8px; display: flex; gap: 8px; align-items: center; margin-top: 16px; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <h2>Assinatura Estudaí</h2>
      <p className="sub">Acesso completo ao Leitor Pro e Formatador ABNT.</p>

      <div className="assinatura-preco">
        <div className="valor">R$ 29,90</div>
        <div className="periodo">por mês · cancele quando quiser</div>
      </div>

      {erro && <div className="assinatura-erro">{erro}</div>}

      {linkPagamento ? (
        <div className="assinatura-sucesso">
          <CheckCircle2 size={18} />
          Assinatura criada! Se a página de pagamento não abriu, <a href={linkPagamento} target="_blank" rel="noopener noreferrer">clique aqui</a>.
        </div>
      ) : (
        <form className="assinatura-form" onSubmit={assinar}>
          <label>
            <span>Nome completo</span>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label>
            <span>CPF ou CNPJ</span>
            <input type="text" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" required />
          </label>
          <button type="submit" className="assinatura-btn" disabled={carregando}>
            {carregando ? <Loader2 size={16} className="spin" /> : <CreditCard size={16} />}
            Assinar agora
          </button>
        </form>
      )}
    </div>
  );
}

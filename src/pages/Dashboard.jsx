import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, FileText, LogOut, User } from 'lucide-react';
import LeitorPro from './LeitorPro';
import FormatadorABNT from './FormatadorABNT';

export default function Dashboard({ session }) {
  const [aba, setAba] = useState('leitor'); // leitor | abnt
  const nome = session?.user?.user_metadata?.full_name || session?.user?.email;

  const sair = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="dash">
      <style>{`
        .dash {
          min-height: 100vh;
          background: #F7F4ED;
          font-family: 'Source Sans Pro', 'Segoe UI', sans-serif;
        }
        .dash-topbar {
          background: #FFFEFA;
          border-bottom: 1px solid #E0D9C6;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dash-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Source Serif Pro', Georgia, serif;
          font-weight: 700;
          font-size: 18px;
          color: #2A4439;
        }
        .dash-nav {
          display: flex;
          gap: 4px;
          background: #F7F4ED;
          border-radius: 8px;
          padding: 4px;
        }
        .dash-nav button {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: none;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #6B6557;
          border-radius: 6px;
          cursor: pointer;
        }
        .dash-nav button.active {
          background: #FFFEFA;
          color: #2A4439;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .dash-user {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: #6B6557;
        }
        .dash-user-nome {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          color: #2A2620;
        }
        .dash-sair {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: 1px solid #E0D9C6;
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 12.5px;
          font-weight: 600;
          color: #6B6557;
          cursor: pointer;
        }
        .dash-sair:hover { border-color: #8B3A2F; color: #8B3A2F; }
        .dash-content { padding: 24px 20px 60px; max-width: 1000px; margin: 0 auto; }
        .dash-content .panel-wrap {
          background: #FFFEFA; border: 1px solid #E0D9C6; border-radius: 10px; padding: 24px;
        }
      `}</style>

      <div className="dash-topbar">
        <div className="dash-brand">
          <BookOpen size={22} />
          Estudaí
        </div>

        <div className="dash-nav">
          <button className={aba === 'leitor' ? 'active' : ''} onClick={() => setAba('leitor')}>
            <BookOpen size={14} /> Leitor Pro
          </button>
          <button className={aba === 'abnt' ? 'active' : ''} onClick={() => setAba('abnt')}>
            <FileText size={14} /> Formatador ABNT
          </button>
        </div>

        <div className="dash-user">
          <span className="dash-user-nome"><User size={14} /> {nome}</span>
          <button className="dash-sair" onClick={sair}><LogOut size={13} /> Sair</button>
        </div>
      </div>

      <div className="dash-content">
        {aba === 'leitor' && <LeitorPro userId={session.user.id} />}
        {aba === 'abnt' && (
          <div className="panel-wrap">
            <FormatadorABNT userId={session.user.id} />
          </div>
        )}
      </div>
    </div>
  );
}

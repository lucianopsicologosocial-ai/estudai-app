import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FileText, Plus, Trash2, Save, Loader2, ChevronLeft } from 'lucide-react';

const INSTITUICOES = ['UNIMES', 'UNOPAR', 'UNIP', 'Estácio', 'Uninter', 'Outra'];

function docVazio() {
  return {
    titulo: '',
    instituicao: 'UNIMES',
    autor: '',
    curso: '',
    resumo: '',
    introducao: '',
    desenvolvimento: '',
    conclusao: '',
    referencias: '',
  };
}

export default function FormatadorABNT({ userId }) {
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(null); // id do doc em edição, ou 'novo'
  const [rascunho, setRascunho] = useState(docVazio());
  const [salvando, setSalvando] = useState(false);

  const carregarDocumentos = useCallback(async () => {
    if (!userId) { setCarregando(false); return; }
    setCarregando(true);
    const { data, error } = await supabase
      .from('abnt_documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (!error && data) setDocumentos(data);
    setCarregando(false);
  }, [userId]);

  useEffect(() => { carregarDocumentos(); }, [carregarDocumentos]);

  const abrirNovo = () => {
    setRascunho(docVazio());
    setEditando('novo');
  };

  const abrirExistente = (doc) => {
    setRascunho({
      titulo: doc.title || '',
      instituicao: doc.institution || 'UNIMES',
      ...(doc.content || {}),
    });
    setEditando(doc.id);
  };

  const salvar = async () => {
    if (!rascunho.titulo.trim()) return;
    setSalvando(true);
    const conteudo = { ...rascunho };
    delete conteudo.titulo;
    delete conteudo.instituicao;
    try {
      if (editando === 'novo') {
        const { error } = await supabase.from('abnt_documents').insert({
          user_id: userId,
          title: rascunho.titulo,
          institution: rascunho.instituicao,
          content: conteudo,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('abnt_documents')
          .update({ title: rascunho.titulo, institution: rascunho.instituicao, content: conteudo, updated_at: new Date().toISOString() })
          .eq('id', editando);
        if (error) throw error;
      }
      await carregarDocumentos();
      setEditando(null);
    } catch (e) {
      alert('Não foi possível salvar agora. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id) => {
    if (!confirm('Excluir este documento?')) return;
    await supabase.from('abnt_documents').delete().eq('id', id);
    carregarDocumentos();
  };

  const gerarTextoFormatado = () => {
    const linhas = [];
    linhas.push(rascunho.titulo.toUpperCase());
    linhas.push('');
    if (rascunho.autor) linhas.push(rascunho.autor);
    linhas.push('');
    if (rascunho.resumo) { linhas.push('RESUMO'); linhas.push(rascunho.resumo); linhas.push(''); }
    if (rascunho.introducao) { linhas.push('1 INTRODUÇÃO'); linhas.push(rascunho.introducao); linhas.push(''); }
    if (rascunho.desenvolvimento) { linhas.push('2 DESENVOLVIMENTO'); linhas.push(rascunho.desenvolvimento); linhas.push(''); }
    if (rascunho.conclusao) { linhas.push('3 CONCLUSÃO'); linhas.push(rascunho.conclusao); linhas.push(''); }
    if (rascunho.referencias) { linhas.push('REFERÊNCIAS'); linhas.push(rascunho.referencias); }
    return linhas.join('\n');
  };

  const copiarTexto = () => {
    navigator.clipboard?.writeText(gerarTextoFormatado());
  };

  if (editando) {
    return (
      <div className="abnt-editor">
        <button className="voltar-btn" onClick={() => setEditando(null)}><ChevronLeft size={16} /> Voltar</button>

        <div className="abnt-form">
          <label>
            <span>Título do trabalho</span>
            <input value={rascunho.titulo} onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })} placeholder="Ex: Inclusão de crianças com discalculia..." />
          </label>

          <div className="abnt-row">
            <label>
              <span>Instituição</span>
              <select value={rascunho.instituicao} onChange={(e) => setRascunho({ ...rascunho, instituicao: e.target.value })}>
                {INSTITUICOES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            <label>
              <span>Curso</span>
              <input value={rascunho.curso} onChange={(e) => setRascunho({ ...rascunho, curso: e.target.value })} placeholder="Ex: Pedagogia" />
            </label>
          </div>

          <label>
            <span>Autor</span>
            <input value={rascunho.autor} onChange={(e) => setRascunho({ ...rascunho, autor: e.target.value })} placeholder="Nome completo" />
          </label>

          <label>
            <span>Resumo</span>
            <textarea value={rascunho.resumo} onChange={(e) => setRascunho({ ...rascunho, resumo: e.target.value })} rows={4} />
          </label>
          <label>
            <span>1 Introdução</span>
            <textarea value={rascunho.introducao} onChange={(e) => setRascunho({ ...rascunho, introducao: e.target.value })} rows={6} />
          </label>
          <label>
            <span>2 Desenvolvimento</span>
            <textarea value={rascunho.desenvolvimento} onChange={(e) => setRascunho({ ...rascunho, desenvolvimento: e.target.value })} rows={10} />
          </label>
          <label>
            <span>3 Conclusão</span>
            <textarea value={rascunho.conclusao} onChange={(e) => setRascunho({ ...rascunho, conclusao: e.target.value })} rows={5} />
          </label>
          <label>
            <span>Referências (norma ABNT NBR 6023)</span>
            <textarea value={rascunho.referencias} onChange={(e) => setRascunho({ ...rascunho, referencias: e.target.value })} rows={5} placeholder="SOBRENOME, Nome. Título. Cidade: Editora, Ano." />
          </label>

          <div className="abnt-acoes">
            <button className="btn-primary" onClick={salvar} disabled={salvando || !rascunho.titulo.trim()}>
              {salvando ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Salvar
            </button>
            <button className="btn-ghost" onClick={copiarTexto}>Copiar texto formatado</button>
          </div>
        </div>

        <StylesABNT />
      </div>
    );
  }

  return (
    <div className="abnt-lista">
      <div className="abnt-lista-header">
        <div>
          <h2>Formatador ABNT</h2>
          <p>Organize seus trabalhos acadêmicos com a estrutura ABNT NBR 14724:2024.</p>
        </div>
        <button className="btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo documento</button>
      </div>

      {carregando ? (
        <p className="abnt-hint">Carregando seus documentos...</p>
      ) : documentos.length === 0 ? (
        <div className="abnt-vazio">
          <FileText size={32} />
          <p>Você ainda não tem documentos. Crie o primeiro para começar.</p>
        </div>
      ) : (
        <div className="abnt-grid">
          {documentos.map((doc) => (
            <div key={doc.id} className="abnt-card" onClick={() => abrirExistente(doc)}>
              <FileText size={18} />
              <div className="abnt-card-body">
                <div className="abnt-card-titulo">{doc.title}</div>
                <div className="abnt-card-meta">{doc.institution} · atualizado em {new Date(doc.updated_at).toLocaleDateString('pt-BR')}</div>
              </div>
              <button className="abnt-card-excluir" onClick={(e) => { e.stopPropagation(); excluir(doc.id); }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <StylesABNT />
    </div>
  );
}

function StylesABNT() {
  return (
    <style>{`
      .abnt-lista-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
      .abnt-lista-header h2 { font-family: 'Source Serif Pro', Georgia, serif; font-size: 22px; margin: 0 0 4px; color: #2A2620; }
      .abnt-lista-header p { color: #6B6557; font-size: 13px; margin: 0; }
      .abnt-hint { color: #6B6557; font-size: 13px; }
      .abnt-vazio { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: #6B6557; text-align: center; }
      .abnt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
      .abnt-card { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; border: 1px solid #E0D9C6; border-radius: 10px; cursor: pointer; background: #FFFEFA; position: relative; }
      .abnt-card:hover { border-color: #3D5A4C; background: #E4EBE6; }
      .abnt-card svg:first-child { color: #3D5A4C; flex-shrink: 0; margin-top: 2px; }
      .abnt-card-body { flex: 1; min-width: 0; }
      .abnt-card-titulo { font-weight: 700; font-size: 13.5px; color: #2A2620; margin-bottom: 4px; }
      .abnt-card-meta { font-size: 11.5px; color: #6B6557; }
      .abnt-card-excluir { background: none; border: none; color: #8B3A2F; cursor: pointer; opacity: 0.6; flex-shrink: 0; }
      .abnt-card-excluir:hover { opacity: 1; }

      .voltar-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; color: #6B6557; font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 16px; padding: 0; }
      .abnt-form { display: flex; flex-direction: column; gap: 16px; max-width: 720px; }
      .abnt-form label { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; font-weight: 600; color: #6B6557; }
      .abnt-form input, .abnt-form select, .abnt-form textarea {
        font-family: inherit; font-size: 14px; padding: 10px 12px; border: 1px solid #E0D9C6; border-radius: 7px; background: #FFFEFA; color: #2A2620; resize: vertical;
      }
      .abnt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .abnt-acoes { display: flex; gap: 10px; margin-top: 6px; }
      .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #3D5A4C; color: #fff; border: none; padding: 10px 18px; border-radius: 7px; font-size: 13.5px; font-weight: 700; cursor: pointer; }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-ghost { display: inline-flex; align-items: center; gap: 6px; background: none; color: #6B6557; border: 1px solid #E0D9C6; padding: 10px 18px; border-radius: 7px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
      .spin { animation: spin 0.8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      @media (max-width: 640px) {
        .abnt-row { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}

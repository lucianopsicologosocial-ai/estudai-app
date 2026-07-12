import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';

import {

  Play, Pause, RotateCcw, Upload, Search, BookOpen, Gauge,

  TrendingUp, Clock, Calendar, ChevronRight, X, Sparkles, FileText,

} from 'lucide-react';

  

// ===========================================================================

// Constantes e helpers

// ===========================================================================

  

const TECNICAS = [

  { id: 'rsvp', label: 'RSVP', desc: 'Uma palavra por vez, no centro da tela' },

  { id: 'chunking', label: 'Chunking', desc: 'Blocos de 3-5 palavras por vez' },

  { id: 'skimming', label: 'Skimming', desc: 'Varredura rápida — primeiras linhas e palavras-chave' },

  { id: 'scanning', label: 'Scanning', desc: 'Busca dirigida por um termo específico' },

];

  

function tokenizar(texto) {

  return texto

    .replace(/\\s+/g, ' ')

    .trim()

    .split(' ')

    .filter(Boolean);

}

  

function formatarTempo(segundos) {

  const m = Math.floor(segundos / 60);

  const s = Math.floor(segundos % 60);

  return `${m}:${s.toString().padStart(2, '0')}`;

}

  

function formatarData(iso) {

  const d = new Date(iso);

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

}

  

const STORAGE_KEY = 'leitorpro:sessoes';

  

// ===========================================================================

// Hook de estatísticas (persistência via window.storage)

// ===========================================================================

  

function useEstatisticas(userId) {

  const [sessoes, setSessoes] = useState([]);

  const [carregado, setCarregado] = useState(false);

  

  useEffect(() => {

    if (!userId) { setCarregado(true); return; }

    (async () => {

      try {

        const { data, error } = await supabase

          .from('leitor_pro_stats')

          .select('*')

          .eq('user_id', userId)

          .order('created_at', { ascending: true })

          .limit(200);

        if (!error && data) {

          setSessoes(data.map((row) => ({

            palavrasLidas: row.words_read,

            segundos: row.duration_seconds,

            tecnica: row.mode,

            data: row.created_at,

            titulo: row.session_date,

          })));

        }

      } catch {

        // silencioso — mostra estado vazio

      } finally {

        setCarregado(true);

      }

    })();

  }, [userId]);

  

  const registrarSessao = useCallback(async (sessao) => {

    setSessoes((prev) => [...prev, sessao].slice(-200));

    if (!userId) return;

    const wpm = sessao.segundos > 0 ? Math.round((sessao.palavrasLidas / sessao.segundos) * 60) : 0;

    try {

      await supabase.from('leitor_pro_stats').insert({

        user_id: userId,

        mode: sessao.tecnica,

        words_read: sessao.palavrasLidas,

        duration_seconds: Math.round(sessao.segundos),

        wpm,

      });

    } catch {

      // falha silenciosa — sessão já está no estado local

    }

  }, [userId]);

  

  const limparHistorico = useCallback(async () => {

    setSessoes([]);

    if (!userId) return;

    try {

      await supabase.from('leitor_pro_stats').delete().eq('user_id', userId);

    } catch {}

  }, [userId]);

  

  return { sessoes, carregado, registrarSessao, limparHistorico };

}

  

// ===========================================================================

// Componentes de UI básicos

// ===========================================================================

  

function Btn({ children, onClick, variant = 'default', disabled, ...props }) {

  return (

    <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled} {...props}>

      {children}

    </button>

  );

}

  

function StatCard({ icon, label, value, sub }) {

  return (

    <div className="stat-card">

      <div className="stat-icon">{icon}</div>

      <div className="stat-body">

        <div className="stat-value">{value}</div>

        <div className="stat-label">{label}</div>

        {sub && <div className="stat-sub">{sub}</div>}

      </div>

    </div>

  );

}

  

// ===========================================================================

// Leitor RSVP

// ===========================================================================

  

function LeitorRSVP({ palavras, onFinalizar }) {

  const [indice, setIndice] = useState(0);

  const [tocando, setTocando] = useState(false);

  const [ppm, setPpm] = useState(300);

  const inicioRef = useRef(null);

  const timerRef = useRef(null);

  

  useEffect(() => {

    if (!tocando) return;

    const intervalo = 60000 / ppm;

    timerRef.current = setTimeout(() => {

      setIndice((i) => {

        if (i + 1 >= palavras.length) {

          setTocando(false);

          finalizarSessao(i + 1);

          return i;

        }

        return i + 1;

      });

    }, intervalo);

    return () => clearTimeout(timerRef.current);

  }, [tocando, indice, ppm, palavras.length]);

  

  const finalizarSessao = (palavrasLidas) => {

    if (!inicioRef.current) return;

    const segundos = (Date.now() - inicioRef.current) / 1000;

    onFinalizar({ palavrasLidas, segundos, ppmConfigurado: ppm, tecnica: 'rsvp' });

  };

  

  const iniciar = () => {

    if (!inicioRef.current) inicioRef.current = Date.now();

    setTocando(true);

  };

  const pausar = () => setTocando(false);

  const reiniciar = () => {

    setTocando(false);

    setIndice(0);

    inicioRef.current = null;

  };

  const parar = () => {

    setTocando(false);

    finalizarSessao(indice + 1);

  };

  

  const progresso = palavras.length ? ((indice + 1) / palavras.length) * 100 : 0;

  

  return (

    <div className="leitor-rsvp">

      <div className="rsvp-display">

        <span className="rsvp-palavra">{palavras[indice] || '—'}</span>

      </div>

      <div className="progress-track">

        <div className="progress-fill" style={{ width: `${progresso}%` }} />

      </div>

      <div className="rsvp-meta">{indice + 1} / {palavras.length} palavras</div>

  

      <div className="rsvp-controles">

        <label className="ppm-control">

          <span>{ppm} ppm</span>

          <input type="range" min="100" max="900" step="25" value={ppm} onChange={(e) => setPpm(Number(e.target.value))} />

        </label>

        <div className="botoes-row">

          {!tocando ? (

            <Btn variant="primary" onClick={iniciar}><Play size={16} /> {indice === 0 ? 'Iniciar' : 'Continuar'}</Btn>

          ) : (

            <Btn variant="secondary" onClick={pausar}><Pause size={16} /> Pausar</Btn>

          )}

          <Btn variant="ghost" onClick={reiniciar}><RotateCcw size={16} /> Reiniciar</Btn>

          <Btn variant="ghost" onClick={parar}>Finalizar sessão</Btn>

        </div>

      </div>

    </div>

  );

}

  

// ===========================================================================

// Leitor Chunking (blocos de palavras)

// ===========================================================================

  

function LeitorChunking({ palavras, onFinalizar }) {

  const [tamanhoChunk, setTamanhoChunk] = useState(4);

  const [indice, setIndice] = useState(0);

  const [tocando, setTocando] = useState(false);

  const [ppm, setPpm] = useState(280);

  const inicioRef = useRef(null);

  

  const chunks = useMemo(() => {

    const out = [];

    for (let i = 0; i < palavras.length; i += tamanhoChunk) {

      out.push(palavras.slice(i, i + tamanhoChunk).join(' '));

    }

    return out;

  }, [palavras, tamanhoChunk]);

  

  useEffect(() => {

    if (!tocando) return;

    const intervalo = (60000 / ppm) * tamanhoChunk;

    const t = setTimeout(() => {

      setIndice((i) => {

        if (i + 1 >= chunks.length) {

          setTocando(false);

          finalizarSessao(palavras.length);

          return i;

        }

        return i + 1;

      });

    }, intervalo);

    return () => clearTimeout(t);

  }, [tocando, indice, ppm, chunks.length, tamanhoChunk]);

  

  const finalizarSessao = (palavrasLidas) => {

    if (!inicioRef.current) return;

    const segundos = (Date.now() - inicioRef.current) / 1000;

    onFinalizar({ palavrasLidas, segundos, ppmConfigurado: ppm, tecnica: 'chunking' });

  };

  

  const iniciar = () => { if (!inicioRef.current) inicioRef.current = Date.now(); setTocando(true); };

  

  return (

    <div className="leitor-rsvp">

      <div className="rsvp-display chunk-display">

        <span className="rsvp-palavra chunk-palavra">{chunks[indice] || '—'}</span>

      </div>

      <div className="progress-track">

        <div className="progress-fill" style={{ width: `${chunks.length ? ((indice + 1) / chunks.length) * 100 : 0}%` }} />

      </div>

      <div className="rsvp-meta">Bloco {indice + 1} / {chunks.length}</div>

  

      <div className="rsvp-controles">

        <label className="ppm-control">

          <span>Tamanho do bloco: {tamanhoChunk} palavras</span>

          <input type="range" min="2" max="7" step="1" value={tamanhoChunk} onChange={(e) => { setTamanhoChunk(Number(e.target.value)); setIndice(0); }} />

        </label>

        <label className="ppm-control">

          <span>{ppm} ppm</span>

          <input type="range" min="100" max="700" step="20" value={ppm} onChange={(e) => setPpm(Number(e.target.value))} />

        </label>

        <div className="botoes-row">

          {!tocando ? (

            <Btn variant="primary" onClick={iniciar}><Play size={16} /> {indice === 0 ? 'Iniciar' : 'Continuar'}</Btn>

          ) : (

            <Btn variant="secondary" onClick={() => setTocando(false)}><Pause size={16} /> Pausar</Btn>

          )}

          <Btn variant="ghost" onClick={() => { setTocando(false); setIndice(0); inicioRef.current = null; }}><RotateCcw size={16} /> Reiniciar</Btn>

          <Btn variant="ghost" onClick={() => { setTocando(false); finalizarSessao(Math.min((indice + 1) * tamanhoChunk, palavras.length)); }}>Finalizar sessão</Btn>

        </div>

      </div>

    </div>

  );

}

  

// ===========================================================================

// Skimming — destaca primeiras palavras de cada frase + palavras-chave

// ===========================================================================

  

function LeitorSkimming({ texto, onFinalizar }) {

  const inicioRef = useRef(Date.now());

  const palavras = useMemo(() => tokenizar(texto), [texto]);

  

  const frases = useMemo(() => texto.split(/(?<=[.!?])\s+/).filter((f) => f.trim().length > 0), [texto]);

  

  const palavrasChave = useMemo(() => {

    const stopwords = new Set(['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'os', 'as', 'no', 'na', 'por', 'mais', 'se', 'como', 'mas', 'foi', 'ao', 'das', 'dos', 'the', 'and', 'of', 'to', 'a', 'in', 'is', 'it', 'that', 'for', 'on', 'with']);

    const freq = {};

    palavras.forEach((p) => {

      const limpo = p.toLowerCase().replace(/[.,!?;:"'()]/g, '');

      if (limpo.length > 4 && !stopwords.has(limpo)) {

        freq[limpo] = (freq[limpo] || 0) + 1;

      }

    });

    return new Set(Object.entries(freq).filter(([, c]) => c > 1).map(([w]) => w));

  }, [palavras]);

  

  const renderFrase = (frase, idx) => {

    const palavrasFrase = frase.split(' ');

    return (

      <p key={idx} className="skim-frase">

        {palavrasFrase.map((p, i) => {

          const limpo = p.toLowerCase().replace(/[.,!?;:"'()]/g, '');

          const destaque = i < 4 || palavrasChave.has(limpo);

          return (

            <span key={i} className={destaque ? 'skim-destaque' : 'skim-apagado'}>{p} </span>

          );

        })}

      </p>

    );

  };

  

  const finalizar = () => {

    const segundos = (Date.now() - inicioRef.current) / 1000;

    onFinalizar({ palavrasLidas: palavras.length, segundos, tecnica: 'skimming' });

  };

  

  return (

    <div className="leitor-texto">

      <p className="modo-hint">Modo skimming: as palavras em destaque são as mais importantes para captar a ideia geral rapidamente.</p>

      <div className="skim-container">{frases.map(renderFrase)}</div>

      <Btn variant="primary" onClick={finalizar}>Concluí a leitura</Btn>

    </div>

  );

}

  

// ===========================================================================

// Scanning — busca por termo específico

// ===========================================================================

  

function LeitorScanning({ texto, onFinalizar }) {

  const [termo, setTermo] = useState('');

  const inicioRef = useRef(Date.now());

  const palavras = useMemo(() => tokenizar(texto), [texto]);

  

  const ocorrencias = useMemo(() => {

    if (!termo.trim()) return 0;

    const regex = new RegExp(termo.trim(), 'gi');

    return (texto.match(regex) || []).length;

  }, [texto, termo]);

  

  const renderTexto = () => {

    if (!termo.trim()) return <p className="scan-texto">{texto}</p>;

    const partes = texto.split(new RegExp(`(${termo.trim()})`, 'gi'));

    return (

      <p className="scan-texto">

        {partes.map((parte, i) =>

          parte.toLowerCase() === termo.trim().toLowerCase()

            ? <mark key={i} className="scan-match">{parte}</mark>

            : <span key={i}>{parte}</span>

        )}

      </p>

    );

  };

  

  const finalizar = () => {

    const segundos = (Date.now() - inicioRef.current) / 1000;

    onFinalizar({ palavrasLidas: palavras.length, segundos, tecnica: 'scanning', termoBuscado: termo, ocorrencias });

  };

  

  return (

    <div className="leitor-texto">

      <p className="modo-hint">Modo scanning: digite um termo e localize rapidamente todas as ocorrências no texto.</p>

      <div className="scan-busca">

        <Search size={16} />

        <input

          type="text"

          placeholder="Digite o termo a localizar..."

          value={termo}

          onChange={(e) => setTermo(e.target.value)}

        />

        {termo.trim() && <span className="scan-contador">{ocorrencias} ocorrência(s)</span>}

      </div>

      <div className="scan-container">{renderTexto()}</div>

      <Btn variant="primary" onClick={finalizar}>Concluí a busca</Btn>

    </div>

  );

}

  

// ===========================================================================

// Fonte de texto: upload, Gutenberg, ou colar texto

// ===========================================================================

  

function FonteTexto({ onTextoCarregado }) {

  const [aba, setAba] = useState('colar');

  const [textoColado, setTextoColado] = useState('');

  const [buscaGutenberg, setBuscaGutenberg] = useState('');

  const [resultadosGutenberg, setResultadosGutenberg] = useState([]);

  const [carregandoGutenberg, setCarregandoGutenberg] = useState(false);

  const [erroGutenberg, setErroGutenberg] = useState('');

  const [carregandoPdf, setCarregandoPdf] = useState(false);

  const fileInputRef = useRef(null);

  

  const buscarGutenberg = async () => {

    if (!buscaGutenberg.trim()) return;

    setCarregandoGutenberg(true);

    setErroGutenberg('');

    try {

      const resp = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(buscaGutenberg)}`);

      const data = await resp.json();

      setResultadosGutenberg(data.results || []);

    } catch (e) {

      setErroGutenberg('Não foi possível buscar agora. Verifique sua conexão.');

    } finally {

      setCarregandoGutenberg(false);

    }

  };

  

  const carregarLivroGutenberg = async (livro) => {

    const formatos = livro.formats || {};

    const urlTexto = formatos['text/plain; charset=utf-8'] || formatos['text/plain'] ||

      Object.entries(formatos).find(([k]) => k.startsWith('text/plain'))?.[1];

    if (!urlTexto) {

      setErroGutenberg('Este título não tem versão em texto simples disponível.');

      return;

    }

    setCarregandoGutenberg(true);

    try {

      const resp = await fetch(urlTexto);

      let texto = await resp.text();

      // remove cabeçalho/rodapé padrão do Project Gutenberg, se presente

      const inicioMarcador = texto.indexOf('*** START OF');

      const fimMarcador = texto.indexOf('*** END OF');

      if (inicioMarcador !== -1) {

        const quebraLinha = texto.indexOf('\n', inicioMarcador);

        texto = texto.slice(quebraLinha + 1, fimMarcador !== -1 ? fimMarcador : undefined);

      }

      onTextoCarregado(texto.trim(), livro.title);

    } catch (e) {

      setErroGutenberg('Não foi possível carregar o texto deste livro.');

    } finally {

      setCarregandoGutenberg(false);

    }

  };

  

  const handlePdfUpload = async (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    setCarregandoPdf(true);

    try {

      if (!window.pdfjsLib) {

        await new Promise((resolve, reject) => {

          const script = document.createElement('script');

          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

          script.onload = resolve;

          script.onerror = reject;

          document.head.appendChild(script);

        });

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      }

      const arrayBuffer = await file.arrayBuffer();

      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let textoCompleto = '';

      for (let i = 1; i <= pdf.numPages; i++) {

        const page = await pdf.getPage(i);

        const content = await page.getTextContent();

        textoCompleto += content.items.map((item) => item.str).join(' ') + '\n\n';

      }

      onTextoCarregado(textoCompleto.trim(), file.name.replace('.pdf', ''));

    } catch (e) {

      alert('Não foi possível ler este PDF. Tente outro arquivo.');

    } finally {

      setCarregandoPdf(false);

    }

  };

  

  return (

    <div className="fonte-texto">

      <div className="fonte-tabs">

        <button className={aba === 'colar' ? 'active' : ''} onClick={() => setAba('colar')}>Colar texto</button>

        <button className={aba === 'pdf' ? 'active' : ''} onClick={() => setAba('pdf')}>Enviar PDF</button>

        <button className={aba === 'gutenberg' ? 'active' : ''} onClick={() => setAba('gutenberg')}>Project Gutenberg</button>

      </div>

  

      {aba === 'colar' && (

        <div className="fonte-painel">

          <textarea

            className="fonte-textarea"

            placeholder="Cole aqui o texto que deseja treinar..."

            value={textoColado}

            onChange={(e) => setTextoColado(e.target.value)}

          />

          <Btn variant="primary" disabled={!textoColado.trim()} onClick={() => onTextoCarregado(textoColado, 'Texto colado')}>

            Usar este texto

          </Btn>

        </div>

      )}

  

      {aba === 'pdf' && (

        <div className="fonte-painel">

          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>

            <Upload size={28} />

            <p>{carregandoPdf ? 'Lendo PDF...' : 'Clique para selecionar um arquivo PDF'}</p>

          </div>

          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />

        </div>

      )}

  

      {aba === 'gutenberg' && (

        <div className="fonte-painel">

          <div className="scan-busca">

            <Search size={16} />

            <input

              type="text"

              placeholder="Buscar título ou autor (ex: Machado de Assis)..."

              value={buscaGutenberg}

              onChange={(e) => setBuscaGutenberg(e.target.value)}

              onKeyDown={(e) => e.key === 'Enter' && buscarGutenberg()}

            />

          </div>

          <Btn variant="secondary" onClick={buscarGutenberg} disabled={carregandoGutenberg}>

            {carregandoGutenberg ? 'Buscando...' : 'Buscar'}

          </Btn>

          {erroGutenberg && <p className="erro-msg">{erroGutenberg}</p>}

          <div className="gutenberg-resultados">

            {resultadosGutenberg.map((livro) => (

              <button key={livro.id} className="gutenberg-item" onClick={() => carregarLivroGutenberg(livro)}>

                <BookOpen size={16} />

                <div>

                  <div className="gutenberg-titulo">{livro.title}</div>

                  <div className="gutenberg-autor">{(livro.authors || []).map((a) => a.name).join(', ') || 'Autor desconhecido'}</div>

                </div>

                <ChevronRight size={16} />

              </button>

            ))}

          </div>

        </div>

      )}

    </div>

  );

}

  

// ===========================================================================

// Gerador de prompt de ilustração

// ===========================================================================

  

function GeradorIlustracao({ texto }) {

  const [trecho, setTrecho] = useState('');

  const [estilo, setEstilo] = useState('aquarela');

  const [prompt, setPrompt] = useState('');

  

  const estilos = ['aquarela', 'realista', 'minimalista', 'noir/preto e branco', 'fantasia épica', 'estilo livro infantil'];

  

  const gerarPrompt = () => {

    const base = trecho.trim() || texto.slice(0, 300);

    const p = `Ilustração no estilo ${estilo}, representando a seguinte cena: "${base.slice(0, 280)}${base.length > 280 ? '...' : ''}". Composição equilibrada, iluminação adequada ao clima da cena, sem texto na imagem.`;

    setPrompt(p);

  };

  

  const copiarPrompt = () => navigator.clipboard?.writeText(prompt);

  

  return (

    <div className="ilustracao-painel">

      <p className="modo-hint">Gere um prompt para criar uma ilustração da cena que você está lendo, e use em sua ferramenta de IA de imagem favorita.</p>

      <textarea

        className="fonte-textarea small"

        placeholder="Cole um trecho específico (ou deixe vazio para usar o início do texto)..."

        value={trecho}

        onChange={(e) => setTrecho(e.target.value)}

      />

      <div className="estilo-chips">

        {estilos.map((e) => (

          <button key={e} className={`tipo-chip ${estilo === e ? 'active' : ''}`} onClick={() => setEstilo(e)}>{e}</button>

        ))}

      </div>

      <Btn variant="primary" onClick={gerarPrompt}><Sparkles size={16} /> Gerar prompt</Btn>

      {prompt && (

        <div className="prompt-resultado">

          <p>{prompt}</p>

          <Btn variant="ghost" onClick={copiarPrompt}>Copiar</Btn>

        </div>

      )}

    </div>

  );

}

  

// ===========================================================================

// Painel de estatísticas

// ===========================================================================

  

function PainelEstatisticas({ sessoes, onLimpar }) {

  const totais = useMemo(() => {

    if (sessoes.length === 0) return null;

    const totalPalavras = sessoes.reduce((acc, s) => acc + (s.palavrasLidas || 0), 0);

    const totalSegundos = sessoes.reduce((acc, s) => acc + (s.segundos || 0), 0);

    const ppmMedio = totalSegundos > 0 ? Math.round((totalPalavras / totalSegundos) * 60) : 0;

    const melhorPpm = Math.max(...sessoes.map((s) => s.segundos > 0 ? Math.round((s.palavrasLidas / s.segundos) * 60) : 0));

    return { totalPalavras, totalSegundos, ppmMedio, melhorPpm, totalSessoes: sessoes.length };

  }, [sessoes]);

  

  const ultimasSessoes = useMemo(() => [...sessoes].reverse().slice(0, 10), [sessoes]);

  

  if (!totais) {

    return (

      <div className="stats-vazio">

        <TrendingUp size={32} />

        <p>Nenhuma sessão registrada ainda. Suas estatísticas vão aparecer aqui conforme você praticar.</p>

      </div>

    );

  }

  

  return (

    <div className="stats-painel">

      <div className="stats-grid">

        <StatCard icon={<Gauge size={20} />} label="Velocidade média" value={`${totais.ppmMedio} ppm`} />

        <StatCard icon={<TrendingUp size={20} />} label="Melhor sessão" value={`${totais.melhorPpm} ppm`} />

        <StatCard icon={<FileText size={20} />} label="Total de palavras lidas" value={totais.totalPalavras.toLocaleString('pt-BR')} />

        <StatCard icon={<Calendar size={20} />} label="Sessões registradas" value={totais.totalSessoes} />

      </div>

  

      <h3 className="stats-subtitulo">Histórico recente</h3>

      <div className="sessoes-lista">

        {ultimasSessoes.map((s, i) => {

          const ppm = s.segundos > 0 ? Math.round((s.palavrasLidas / s.segundos) * 60) : 0;

          return (

            <div key={i} className="sessao-item">

              <div className="sessao-tecnica">{TECNICAS.find((t) => t.id === s.tecnica)?.label || s.tecnica}</div>

              <div className="sessao-info">

                <span>{s.palavrasLidas} palavras</span>

                <span><Clock size={12} /> {formatarTempo(s.segundos)}</span>

                <span className="sessao-ppm">{ppm} ppm</span>

              </div>

              <div className="sessao-data">{formatarData(s.data)}</div>

            </div>

          );

        })}

      </div>

      <button className="link-limpar" onClick={onLimpar}>Limpar histórico</button>

    </div>

  );

}

  

// ===========================================================================

// App principal

// ===========================================================================

  

export default function LeitorPro({ userId }) {

  const [texto, setTexto] = useState('');

  const [tituloTexto, setTituloTexto] = useState('');

  const [tecnica, setTecnica] = useState('rsvp');

  const [aba, setAba] = useState('fonte'); // fonte | leitor | ilustracao | stats

  const [ultimoResultado, setUltimoResultado] = useState(null);

  const { sessoes, carregado, registrarSessao, limparHistorico } = useEstatisticas(userId);

  

  const palavras = useMemo(() => tokenizar(texto), [texto]);

  

  const handleTextoCarregado = (novoTexto, titulo) => {

    setTexto(novoTexto);

    setTituloTexto(titulo);

    setAba('leitor');

    setUltimoResultado(null);

  };

  

  const handleFinalizar = (resultado) => {

    const sessao = { ...resultado, data: new Date().toISOString(), titulo: tituloTexto };

    registrarSessao(sessao);

    setUltimoResultado(sessao);

  };

  

  return (

    <div className="app">

      <style>{`

        .app {

          --bg: #F7F4ED;

          --ink: #2A2620;

          --ink-soft: #6B6557;

          --line: #E0D9C6;

          --accent: #3D5A4C;

          --accent-light: #E4EBE6;

          --accent-strong: #2A4439;

          --paper: #FFFEFA;

          font-family: 'Source Sans Pro', 'Segoe UI', sans-serif;

          background: var(--bg);

          color: var(--ink);

          min-height: 100vh;

          padding: 28px 18px 60px;

        }

        .app * { box-sizing: border-box; }

        .header { max-width: 920px; margin: 0 auto 24px; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

        .header h1 { font-family: 'Source Serif Pro', Georgia, serif; font-size: 28px; margin: 0; letter-spacing: -0.01em; }

        .header .subtitle { color: var(--ink-soft); font-size: 13px; margin: 4px 0 0; }

        .tabs { max-width: 920px; margin: 0 auto 20px; display: flex; gap: 6px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }

        .tab-btn { background: none; border: none; padding: 10px 14px; font-size: 13px; font-weight: 600; color: var(--ink-soft); cursor: pointer; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px; transform: translateY(1px); }

        .tab-btn.active { color: var(--accent-strong); border-bottom-color: var(--accent); }

        .panel { max-width: 920px; margin: 0 auto; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; padding: 24px; }

  

        .fonte-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: var(--bg); border-radius: 8px; padding: 4px; width: fit-content; }

        .fonte-tabs button { border: none; background: none; padding: 7px 13px; font-size: 12.5px; font-weight: 600; color: var(--ink-soft); border-radius: 6px; cursor: pointer; }

        .fonte-tabs button.active { background: var(--paper); color: var(--accent-strong); box-shadow: 0 1px 2px rgba(0,0,0,0.06); }

        .fonte-painel { display: flex; flex-direction: column; gap: 12px; }

        .fonte-textarea { width: 100%; min-height: 160px; font-family: 'Source Serif Pro', Georgia, serif; font-size: 14.5px; line-height: 1.6; padding: 14px; border: 1px solid var(--line); border-radius: 8px; resize: vertical; background: var(--paper); color: var(--ink); }

        .fonte-textarea.small { min-height: 90px; }

        .upload-zone { border: 2px dashed var(--line); border-radius: 10px; padding: 36px 20px; text-align: center; color: var(--ink-soft); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; }

        .upload-zone:hover { border-color: var(--accent); color: var(--accent-strong); }

  

        .scan-busca { display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; background: var(--paper); }

        .scan-busca input { border: none; outline: none; flex: 1; font-size: 13.5px; background: transparent; color: var(--ink); }

        .scan-busca svg { color: var(--ink-soft); flex-shrink: 0; }

        .scan-contador { font-size: 11.5px; color: var(--accent-strong); font-weight: 600; white-space: nowrap; }

  

        .gutenberg-resultados { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }

        .gutenberg-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); cursor: pointer; text-align: left; color: var(--ink); }

        .gutenberg-item:hover { border-color: var(--accent); background: var(--accent-light); }

        .gutenberg-item > div { flex: 1; min-width: 0; }

        .gutenberg-titulo { font-size: 13.5px; font-weight: 600; }

        .gutenberg-autor { font-size: 11.5px; color: var(--ink-soft); }

        .gutenberg-item svg:first-child { color: var(--accent); flex-shrink: 0; }

        .gutenberg-item svg:last-child { color: var(--ink-soft); flex-shrink: 0; }

        .erro-msg { color: #8B3A2F; font-size: 12.5px; }

  

        .tecnica-seletor { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }

        .tecnica-chip { font-size: 12.5px; padding: 8px 14px; border-radius: 20px; border: 1px solid var(--line); background: var(--bg); color: var(--ink-soft); cursor: pointer; font-weight: 600; }

        .tecnica-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }

        .tecnica-desc { font-size: 12px; color: var(--ink-soft); margin-bottom: 16px; }

  

        .leitor-rsvp { display: flex; flex-direction: column; align-items: center; gap: 16px; }

        .rsvp-display { width: 100%; min-height: 140px; display: flex; align-items: center; justify-content: center; background: var(--accent-light); border-radius: 12px; }

        .rsvp-palavra { font-family: 'Source Serif Pro', Georgia, serif; font-size: 42px; font-weight: 600; color: var(--accent-strong); }

        .chunk-palavra { font-size: 30px; }

        .progress-track { width: 100%; height: 6px; background: var(--line); border-radius: 4px; overflow: hidden; }

        .progress-fill { height: 100%; background: var(--accent); transition: width 0.2s; }

        .rsvp-meta { font-size: 12px; color: var(--ink-soft); }

        .rsvp-controles { width: 100%; display: flex; flex-direction: column; gap: 14px; align-items: center; }

        .ppm-control { display: flex; flex-direction: column; gap: 4px; width: 100%; max-width: 360px; font-size: 12.5px; color: var(--ink-soft); font-weight: 600; }

        .ppm-control input { width: 100%; }

        .botoes-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

  

        .btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 9px 16px; border-radius: 7px; cursor: pointer; border: 1px solid transparent; }

        .btn-primary { background: var(--accent); color: #fff; }

        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-secondary { background: var(--accent-light); color: var(--accent-strong); }

        .btn-ghost { background: none; color: var(--ink-soft); border-color: var(--line); }

  

        .leitor-texto { display: flex; flex-direction: column; gap: 14px; }

        .modo-hint { font-size: 12.5px; color: var(--ink-soft); background: var(--accent-light); padding: 10px 14px; border-radius: 8px; margin: 0; }

        .skim-container, .scan-container { max-height: 420px; overflow-y: auto; padding: 4px; }

        .skim-frase { font-family: 'Source Serif Pro', Georgia, serif; font-size: 15px; line-height: 1.7; margin: 0 0 10px; }

        .skim-destaque { color: var(--ink); font-weight: 600; }

        .skim-apagado { color: #C8C2B2; }

        .scan-texto { font-family: 'Source Serif Pro', Georgia, serif; font-size: 15px; line-height: 1.8; white-space: pre-wrap; }

        .scan-match { background: #F2D9A8; padding: 1px 2px; border-radius: 3px; }

  

        .tipo-chip { font-size: 12px; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--line); background: var(--bg); color: var(--ink-soft); cursor: pointer; }

        .tipo-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }

        .estilo-chips { display: flex; flex-wrap: wrap; gap: 6px; }

        .ilustracao-painel { display: flex; flex-direction: column; gap: 14px; }

        .prompt-resultado { background: var(--accent-light); border-radius: 8px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }

        .prompt-resultado p { margin: 0; font-size: 13.5px; line-height: 1.6; }

  

        .stats-vazio { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 50px 20px; color: var(--ink-soft); text-align: center; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }

        .stat-card { background: var(--accent-light); border-radius: 10px; padding: 14px 16px; display: flex; gap: 10px; align-items: flex-start; }

        .stat-icon { color: var(--accent-strong); margin-top: 2px; }

        .stat-value { font-size: 20px; font-weight: 700; color: var(--accent-strong); font-family: 'Source Serif Pro', Georgia, serif; }

        .stat-label { font-size: 11px; color: var(--ink-soft); margin-top: 2px; }

        .stats-subtitulo { font-size: 14px; margin: 0 0 10px; color: var(--ink); }

        .sessoes-lista { display: flex; flex-direction: column; gap: 6px; }

        .sessao-item { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; font-size: 12.5px; }

        .sessao-tecnica { font-weight: 700; color: var(--accent-strong); min-width: 80px; }

        .sessao-info { display: flex; gap: 14px; color: var(--ink-soft); flex: 1; }

        .sessao-info span { display: flex; align-items: center; gap: 4px; }

        .sessao-ppm { font-weight: 700; color: var(--accent-strong); }

        .sessao-data { color: var(--ink-soft); font-size: 11.5px; white-space: nowrap; }

        .link-limpar { margin-top: 14px; background: none; border: none; color: var(--ink-soft); font-size: 12px; text-decoration: underline; cursor: pointer; align-self: flex-start; }

  

        .resultado-sessao { background: var(--accent-light); border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 13px; color: var(--accent-strong); text-align: center; }

  

        @media (max-width: 640px) {

          .stats-grid { grid-template-columns: repeat(2, 1fr); }

          .rsvp-palavra { font-size: 30px; }

          .sessao-info { flex-wrap: wrap; gap: 8px; }

        }

      `}</style>

  

      <div className="header">

        <div>

          <h1>LeitorPro</h1>

          <p className="subtitle">{tituloTexto ? `Lendo: ${tituloTexto}` : 'Treino de leitura dinâmica'}</p>

        </div>

      </div>

  

      <div className="tabs">

        <button className={`tab-btn ${aba === 'fonte' ? 'active' : ''}`} onClick={() => setAba('fonte')}>

          <Upload size={14} /> Texto

        </button>

        <button className={`tab-btn ${aba === 'leitor' ? 'active' : ''}`} onClick={() => texto && setAba('leitor')} disabled={!texto}>

          <BookOpen size={14} /> Treinar

        </button>

        <button className={`tab-btn ${aba === 'ilustracao' ? 'active' : ''}`} onClick={() => texto && setAba('ilustracao')} disabled={!texto}>

          <Sparkles size={14} /> Ilustração

        </button>

        <button className={`tab-btn ${aba === 'stats' ? 'active' : ''}`} onClick={() => setAba('stats')}>

          <TrendingUp size={14} /> Estatísticas

        </button>

      </div>

  

      <div className="panel">

        {aba === 'fonte' && <FonteTexto onTextoCarregado={handleTextoCarregado} />}

  

        {aba === 'leitor' && texto && (

          <>

            <div className="tecnica-seletor">

              {TECNICAS.map((t) => (

                <button key={t.id} className={`tecnica-chip ${tecnica === t.id ? 'active' : ''}`} onClick={() => { setTecnica(t.id); setUltimoResultado(null); }}>

                  {t.label}

                </button>

              ))}

            </div>

            <p className="tecnica-desc">{TECNICAS.find((t) => t.id === tecnica)?.desc}</p>

  

            {tecnica === 'rsvp' && <LeitorRSVP key={tituloTexto} palavras={palavras} onFinalizar={handleFinalizar} />}

            {tecnica === 'chunking' && <LeitorChunking key={tituloTexto} palavras={palavras} onFinalizar={handleFinalizar} />}

            {tecnica === 'skimming' && <LeitorSkimming key={tituloTexto} texto={texto} onFinalizar={handleFinalizar} />}

            {tecnica === 'scanning' && <LeitorScanning key={tituloTexto} texto={texto} onFinalizar={handleFinalizar} />}

  

            {ultimoResultado && (

              <div className="resultado-sessao">

                Sessão registrada: {ultimoResultado.palavrasLidas} palavras em {formatarTempo(ultimoResultado.segundos)}

                {ultimoResultado.segundos > 0 && ` — ${Math.round((ultimoResultado.palavrasLidas / ultimoResultado.segundos) * 60)} ppm`}

              </div>

            )}

          </>

        )}

  

        {aba === 'ilustracao' && texto && <GeradorIlustracao texto={texto} />}

  

        {aba === 'stats' && (

          carregado

            ? <PainelEstatisticas sessoes={sessoes} onLimpar={limparHistorico} />

            : <p className="modo-hint">Carregando estatísticas...</p>

        )}

      </div>

    </div>

  );

}

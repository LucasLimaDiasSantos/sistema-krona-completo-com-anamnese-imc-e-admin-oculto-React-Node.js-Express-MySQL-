import React, { useState, useEffect } from 'react';
import api from './services/api';
import './App.css';

function App() {
  const [abaAtiva, setAbaAtiva] = useState('cadastro');

  // Deteta automaticamente se o utilizador colocou #admin na URL
  useEffect(() => {
    const caminhoOuHash = window.location.pathname + window.location.hash;
    if (caminhoOuHash.toLowerCase().includes('admin')) {
      setAbaAtiva('admin');
    }
  }, []);

  const estadoInicialForm = {
    nome: '',
    idade: '25',
    sexo: 'Masculino',
    peso: '75',
    altura: '175',
    experiencia: 'Intermédio',
    dias_disponiveis: '5 dias',
    objetivo: 'Hipertrofia',
    frequencia: '5 dias (ABCDE)',
    restricoes: ''
  };

  const [form, setForm] = useState(estadoInicialForm);
  const [loading, setLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  // Painel Admin & Segurança
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [listaAlunos, setListaAlunos] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [treinoDetalhado, setTreinoDetalhado] = useState(null);
  const [loadingTreino, setLoadingTreino] = useState(false);
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);

  const SENHA_ADMIN_CORRETA = 'krona123';

  useEffect(() => {
    if (abaAtiva === 'admin' && isAdminAuth) {
      carregarAlunos();
    }
  }, [abaAtiva, isAdminAuth]);

  const carregarAlunos = async () => {
    try {
      setLoadingAdmin(true);
      const response = await api.get('/anamnese');
      const dadosBrutos = response.data.dados || response.data;
      setListaAlunos(Array.isArray(dadosBrutos) ? dadosBrutos : []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      setListaAlunos([]);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleLoginAdmin = (e) => {
    e.preventDefault();
    if (senhaInput === SENHA_ADMIN_CORRETA) {
      setIsAdminAuth(true);
      setSenhaInput('');
    } else {
      alert('Senha incorreta!');
      setSenhaInput('');
    }
  };

  const handleDeletarAluno = async (id, nome) => {
    if (window.confirm(`Apagar registo de ${nome || 'este aluno'}?`)) {
      try {
        await api.delete(`/anamnese/${id}`);
        setListaAlunos(prev => prev.filter(a => a.id !== id));
        if (alunoSelecionado?.id === id) {
          setAlunoSelecionado(null);
          setTreinoDetalhado(null);
        }
      } catch (error) {
        alert('Erro ao apagar registo.');
      }
    }
  };

  const handleVerFichaCompleta = async (aluno) => {
    setAlunoSelecionado(aluno);
    setTreinoDetalhado(null);
    setCopiadoFeedback(false);
    try {
      setLoadingTreino(true);
      const response = await api.get(`/anamnese/${aluno.id}/treino`);
      setTreinoDetalhado(response.data);
    } catch (error) {
      alert('Erro ao carregar ficha detalhada.');
    } finally {
      setLoadingTreino(false);
    }
  };

  const obterClassificacaoIMC = (imc) => {
    const val = parseFloat(imc);
    if (!val || isNaN(val)) return { texto: 'N/A', cor: '#9ca3af' };
    if (val < 18.5) return { texto: 'Abaixo do peso', cor: '#38bdf8' };
    if (val < 25) return { texto: 'Peso normal', cor: '#34d399' };
    if (val < 30) return { texto: 'Sobrepeso', cor: '#fbbf24' };
    return { texto: 'Obesidade', cor: '#f87171' };
  };

  const handleCopiarTreino = () => {
    if (!treinoDetalhado || !treinoDetalhado.fichaTreino) return;

    let textoFormatado = `*FICHA DE TREINO - KRONA*\n`;
    textoFormatado += `Aluno: ${alunoSelecionado?.aluno || alunoSelecionado?.nome}\n`;
    textoFormatado += `Divisão: ${treinoDetalhado.fichaTreino.divisao}\n`;
    textoFormatado += `Volume: ${treinoDetalhado.prescricaoTreino?.volumeSeries}\n`;
    textoFormatado += `Método: ${treinoDetalhado.prescricaoTreino?.metodoAplicado}\n\n`;

    Object.entries(treinoDetalhado.fichaTreino.treinos).forEach(([dia, exercicios]) => {
      textoFormatado += `--- ${dia} ---\n`;
      exercicios.forEach(ex => {
        textoFormatado += `• ${ex}\n`;
      });
      textoFormatado += `\n`;
    });

    if (treinoDetalhado.avisoRestricoes) {
      textoFormatado += `${treinoDetalhado.avisoRestricoes}\n`;
    }

    navigator.clipboard.writeText(textoFormatado);
    setCopiadoFeedback(true);
    setTimeout(() => setCopiadoFeedback(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMensagemSucesso(false);
      await api.post('/anamnese', form);
      setForm(estadoInicialForm);
      setMensagemSucesso(true);
    } catch (error) {
      alert('Erro ao enviar anamnese.');
    } finally {
      setLoading(false);
    }
  };

  const totalAlunos = listaAlunos.length;
  const objetivoMaisComum = totalAlunos > 0 ? 'Hipertrofia' : 'Nenhum';
  const alunosFiltrados = listaAlunos.filter(a => 
    (a.aluno || a.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (a.objetivo || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="krona-container">
      {/* CABEÇALHO LIMPO SEM O BOTÃO ADMIN */}
      <div className="header">
        <h1>Krona</h1>
        <p>Motor Inteligente de Prescrição de Treinos</p>
      </div>

      {abaAtiva === 'cadastro' && (
        <>
          <form onSubmit={handleSubmit} className="card-form">
            <h3>Anamnese Completa do Aluno</h3>

            <div className="input-group">
              <label>Nome Completo</label>
              <input type="text" className="input-field" placeholder="Ex: Lucas Santos" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label>Idade</label>
                <input type="number" className="input-field" value={form.idade} onChange={e => setForm({...form, idade: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Sexo Biológico</label>
                <select className="input-field" value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})}>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label>Peso (kg)</label>
                <input type="number" step="0.1" className="input-field" placeholder="Ex: 78.5" value={form.peso} onChange={e => setForm({...form, peso: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Altura (cm ou m)</label>
                <input type="number" step="0.01" className="input-field" placeholder="Ex: 175 ou 1.75" value={form.altura} onChange={e => setForm({...form, altura: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label>Experiência na Academia</label>
                <select className="input-field" value={form.experiencia} onChange={e => setForm({...form, experiencia: e.target.value})}>
                  <option value="Iniciante">Iniciante (Menos de 6 meses)</option>
                  <option value="Intermédio">Intermédio (6 meses a 2 anos)</option>
                  <option value="Avançado">Avançado (Mais de 2 anos)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Frequência / Dias Disponíveis</label>
                <select className="input-field" value={form.frequencia} onChange={e => setForm({...form, frequencia: e.target.value})}>
                  <option value="3 dias">3 dias (ABC)</option>
                  <option value="4 dias">4 dias (Upper/Lower)</option>
                  <option value="5 dias (ABCDE)">5 dias (ABCDE)</option>
                  <option value="6 dias">6 dias (ABC 2x)</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Objetivo Principal</label>
              <select className="input-field" value={form.objetivo} onChange={e => setForm({...form, objetivo: e.target.value})}>
                <option value="Hipertrofia">Hipertrofia (Ganho de Massa)</option>
                <option value="Emagrecimento">Emagrecimento (Definição)</option>
                <option value="Força">Força Máxima / Powerbuilding</option>
                <option value="Resistência">Resistência e Condicionamento</option>
              </select>
            </div>

            <div className="input-group">
              <label>Restrições Físicas / Lesões</label>
              <input type="text" className="input-field" placeholder="Ex: Nenhuma, dor no ombro direito" value={form.restricoes} onChange={e => setForm({...form, restricoes: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'A registar anamnese...' : 'Enviar Anamnese'}
            </button>
          </form>

          {mensagemSucesso && (
            <div className="ficha-container" style={{ textAlign: 'center', padding: '30px' }}>
              <h2 style={{ color: '#ec4899', marginBottom: '12px' }}>Anamnese Enviada com Sucesso! 🚀</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Os dados foram guardados e o IMC foi calculado automaticamente.</p>
              <button className="btn-sm" onClick={() => setMensagemSucesso(false)}>Preencher Outra Anamnese</button>
            </div>
          )}
        </>
      )}

      {abaAtiva === 'admin' && (
        <>
          {!isAdminAuth ? (
            <form onSubmit={handleLoginAdmin} className="card-form" style={{ maxWidth: '400px', margin: '40px auto' }}>
              <h3>Acesso Restrito</h3>
              <div className="input-group">
                <label>Senha de Administrador</label>
                <input type="password" className="input-field" placeholder="••••••••" value={senhaInput} onChange={e => setSenhaInput(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary">Entrar no Painel</button>
            </form>
          ) : (
            <div className="admin-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Painel de Gestão Krona</h3>
                <button className="btn-sm" style={{ background: '#374151' }} onClick={() => { setIsAdminAuth(false); window.location.hash = ''; setAbaAtiva('cadastro'); }}>Sair</button>
              </div>

              <div className="metrics-grid">
                <div className="metric-card"><span className="metric-title">Total de Alunos</span><span className="metric-value">{totalAlunos}</span></div>
                <div className="metric-card"><span className="metric-title">Fichas Cadastradas</span><span className="metric-value">{totalAlunos}</span></div>
                <div className="metric-card"><span className="metric-title">Objetivo Principal</span><span className="metric-value" style={{ fontSize: '1.2rem', marginTop: '4px' }}>{objetivoMaisComum}</span></div>
              </div>

              <div className="card-form" style={{ marginTop: '20px' }}>
                <div className="input-group">
                  <label>Buscar Aluno</label>
                  <input type="text" className="input-field" placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>

                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr><th>ID</th><th>Aluno</th><th>Idade</th><th>IMC</th><th>Objetivo</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                      {loadingAdmin ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>A carregar...</td></tr>
                      ) : alunosFiltrados.length > 0 ? (
                        alunosFiltrados.map(item => {
                          const imcInfo = obterClassificacaoIMC(item.imc);
                          return (
                            <tr key={item.id}>
                              <td>#{item.id}</td>
                              <td style={{ fontWeight: '600', color: '#fff' }}>{item.aluno || item.nome}</td>
                              <td>{item.idade} anos</td>
                              <td>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: imcInfo.cor }}></span>
                                  {item.imc || 'N/A'} ({imcInfo.texto})
                                </span>
                              </td>
                              <td>{item.objetivo}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button className="btn-sm" onClick={() => handleVerFichaCompleta(item)}>Ver Ficha</button>
                                  <button className="btn-sm" style={{ background: '#ef4444' }} onClick={() => handleDeletarAluno(item.id, item.aluno || item.nome)}>Apagar</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum cadastro encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {alunoSelecionado && (
                <div className="ficha-container" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2>Ficha de: {alunoSelecionado.aluno || alunoSelecionado.nome}</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-sm" style={{ background: '#10b981' }} onClick={handleCopiarTreino}>
                        {copiadoFeedback ? 'Copiado! ✓' : 'Copiar Treino'}
                      </button>
                      <button className="btn-sm" style={{ background: '#374151' }} onClick={() => { setAlunoSelecionado(null); setTreinoDetalhado(null); }}>Fechar</button>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <strong>Sexo:</strong> {alunoSelecionado.sexo} | 
                    <strong> Idade:</strong> {alunoSelecionado.idade} anos | 
                    <strong> Peso:</strong> {alunoSelecionado.peso}kg | 
                    <strong> Altura:</strong> {alunoSelecionado.altura}m | 
                    <strong> IMC:</strong> <span style={{ color: obterClassificacaoIMC(alunoSelecionado.imc).cor }}>{alunoSelecionado.imc} ({obterClassificacaoIMC(alunoSelecionado.imc).texto})</span> | 
                    <strong> Experiência:</strong> {alunoSelecionado.experiencia}
                  </p>

                  {loadingTreino ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>A calcular treino inteligente...</div>
                  ) : treinoDetalhado && treinoDetalhado.fichaTreino ? (
                    <>
                      <div className="ficha-header" style={{ marginBottom: '16px' }}>
                        <span className="badge-info">{treinoDetalhado.fichaTreino.divisao}</span>
                      </div>
                      <div className="bloco-destaque bloco-prescricao" style={{ marginBottom: '12px' }}>
                        <p><strong>Volume:</strong> {treinoDetalhado.prescricaoTreino?.volumeSeries}</p>
                        <p><strong>Método:</strong> {treinoDetalhado.prescricaoTreino?.metodoAplicado}</p>
                      </div>

                      {Object.entries(treinoDetalhado.fichaTreino.treinos).map(([dia, exercicios]) => (
                        <div key={dia} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', marginBottom: '10px' }}>
                          <h4 style={{ color: '#f472b6', marginBottom: '6px' }}>{dia}</h4>
                          <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {Array.isArray(exercicios) && exercicios.map((ex, i) => <li key={i} style={{ color: '#e5e7eb' }}>{ex}</li>)}
                          </ul>
                        </div>
                      ))}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
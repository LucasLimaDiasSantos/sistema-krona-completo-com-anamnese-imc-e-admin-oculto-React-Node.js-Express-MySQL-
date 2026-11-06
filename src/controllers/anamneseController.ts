import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Banco de dados completo de exercícios por grupo muscular
const BANCO_EXERCICIOS = {
  peito: [
    'Supino Reto com Barra',
    'Supino Inclinado com Halteres',
    'Supino Reto com Halteres',
    'Supino Declinado',
    'Crossover no Cabo (Polia Alta)',
    'Crossover no Cabo (Polia Baixa)',
    'Peck Deck (Voador)',
    'Flexão de Braços no Solo',
    'Supino Reto na Máquina (Chest Press)'
  ],
  costas: [
    'Puxada Alta Frontal (Polia)',
    'Puxada Alta com Triângulo',
    'Remada Curvada com Barra',
    'Remada Unilateral com Halter (Serrote)',
    'Remada Baixa no Triângulo (Polia)',
    'Remada Cavalinho (T-Bar)',
    'Pullover com Halter no Banco',
    'Pullover na Polia Alta',
    'Barra Fixa com Assistência'
  ],
  pernasQuadriceps: [
    'Agachamento Livre com Barra',
    'Agachamento no Smith',
    'Leg Press 45°',
    'Leg Press Horizontal',
    'Cadeira Extensora',
    'Afundo com Halteres',
    'Agachamento Búlgaro'
  ],
  pernasPosteriorGluteos: [
    'Stiff com Barra ou Halteres',
    'Mesa Flexora',
    'Cadeira Flexora',
    'Elevação Pélvica na Máquina / Barra',
    'Cadeira Abdutora',
    'Cadeira Adutora',
    'Good Morning com Barra'
  ],
  panturrilhas: [
    'Panturrilha em Pé na Máquina (Máquina / Smith)',
    'Panturrilha Sentado (Máquina Solear)',
    'Panturrilha no Leg Press 45°'
  ],
  ombros: [
    'Desenvolvimento com Halteres',
    'Desenvolvimento Militar com Barra',
    'Desenvolvimento na Máquina',
    'Elevação Lateral com Halteres',
    'Elevação Lateral no Cabo',
    'Elevação Frontal com Halteres ou Corda',
    'Crucifixo Inverso no Peck Deck',
    'Crucifixo Inverso com Halteres (Banco Inclinado)'
  ],
  trapezio: [
    'Encolhimento de Ombros com Barra',
    'Encolhimento com Halteres',
    'Remada Alta com Barra W ou Polia'
  ],
  biceps: [
    'Rosca Direta com Barra W',
    'Rosca Direta com Halteres',
    'Rosca Alternada no Banco Inclinado',
    'Rosca Scott com Barra Reta ou W',
    'Rosca Martelo com Halteres',
    'Rosca no Cabo (Polia Baixa)'
  ],
  triceps: [
    'Tríceps Pulley na Corda',
    'Tríceps Pulley com Barra Reta',
    'Tríceps Testa com Barra W',
    'Tríceps Francês com Halter',
    'Tríceps Coice no Cabo',
    'Paralelas / Mergulho no Aparelho'
  ],
  antebraco: [
    'Rosca Inversa com Barra W',
    'Rosca de Punho (Flexão) com Barra',
    'Rosca de Punho (Extensão)'
  ],
  core: [
    'Prancha Abdominal Isométrica',
    'Abdominal Supra no Solo',
    'Abdominal Supra na Polia (Crunch)',
    'Abdominal Infra na Barra Fixa (Elevação de Pernas)',
    'Abdominal Infra na Banco Inclinado',
    'Rotação de Tronco no Cabo (Oblíquos)'
  ],
  cardio: [
    'Esteira - Corrida Contínua ou Moderada',
    'Esteira - Intervalado de Alta Intensidade (HIIT)',
    'Bike Ergométrica (Ciclismo Indoor)',
    'Elíptico (Glute Trainer)',
    'Remo Indoor (Ergômetro)'
  ]
};

export class AnamneseController {

  // 1. CREATE: Cadastra uma nova anamnese no MySQL com cálculo automático de IMC
  criar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { nome, idade, sexo, peso, altura, experiencia, dias_disponiveis, objetivo, frequencia, restricoes } = req.body;

      if (!nome || !objetivo || !peso || !altura) {
        return res.status(400).json({ 
          erro: 'Nome, objetivo, peso e altura são obrigatórios para a anamnese!' 
        });
      }

      // Cálculo automático do IMC (Tratando caso o usuário digite em centímetros tipo 175 ou metros tipo 1.75)
      const altMetros = Number(altura) > 3 ? Number(altura) / 100 : Number(altura);
      const imc = (Number(peso) / (altMetros * altMetros)).toFixed(2);

      const query = `
        INSERT INTO anamneses (nome, idade, sexo, peso, altura, imc, experiencia, dias_disponiveis, objetivo, frequencia, restricoes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute<ResultSetHeader>(query, [
        nome, 
        idade || null, 
        sexo || 'Outro',
        peso,
        altura,
        imc,
        experiencia || 'Iniciante',
        dias_disponiveis || frequencia,
        objetivo, 
        frequencia || null, 
        restricoes || null
      ]);

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Anamnese salva no MySQL com sucesso pela Krona!',
        idCadastrado: result.insertId,
        imcCalculado: imc
      });
    } catch (error) {
      console.error('Erro ao criar anamnese:', error);
      return res.status(500).json({ erro: 'Erro interno ao salvar no MySQL.' });
    }
  };

  // 2. READ (All): Lista todas as anamneses formatando 'aluno' para o front-end
  listar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM anamneses ORDER BY id DESC');

      const dadosFormatados = rows.map(row => ({
        ...row,
        aluno: row.nome // Garante que a propriedade 'aluno' venha preenchida para a tabela
      }));

      return res.json(dadosFormatados);
    } catch (error) {
      console.error('Erro ao listar anamneses:', error);
      return res.status(500).json({ erro: 'Erro interno ao buscar anamneses no MySQL.' });
    }
  };

  // 3. READ (One): Busca por ID
  buscarPorId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM anamneses WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ erro: 'Anamnese não encontrada.' });
      }

      return res.json({
        sucesso: true,
        dado: { ...rows[0], aluno: rows[0].nome }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ erro: 'Erro interno ao buscar anamnese.' });
    }
  };

  // 4. UPDATE: Atualiza os dados recalculando o IMC se necessário
  atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { nome, idade, sexo, peso, altura, experiencia, dias_disponiveis, objetivo, frequencia, restricoes } = req.body;

      const altMetros = Number(altura) > 3 ? Number(altura) / 100 : Number(altura);
      const imc = peso && altura ? (Number(peso) / (altMetros * altMetros)).toFixed(2) : null;

      const query = `
        UPDATE anamneses 
        SET nome = ?, idade = ?, sexo = ?, peso = ?, altura = ?, imc = ?, experiencia = ?, dias_disponiveis = ?, objetivo = ?, frequencia = ?, restricoes = ?
        WHERE id = ?
      `;

      const [result] = await pool.execute<ResultSetHeader>(query, [
        nome, idade || null, sexo, peso, altura, imc, experiencia, dias_disponiveis, objetivo, frequencia || null, restricoes || null, id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ erro: 'Anamnese não encontrada para atualização.' });
      }

      return res.json({ sucesso: true, mensagem: 'Anamnese atualizada com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ erro: 'Erro interno ao atualizar anamnese.' });
    }
  };

  // 5. DELETE: Remove do banco
  deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM anamneses WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ erro: 'Anamnese não encontrada para remoção.' });
      }

      return res.json({ sucesso: true, mensagem: 'Anamnese removida com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ erro: 'Erro interno ao deletar anamnese.' });
    }
  };

  // 6. GERAR TREINO DINÂMICO
  gerarTreino = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM anamneses WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ erro: 'Anamnese não encontrada.' });
      }

      const anamnese = rows[0];
      const objetivo = anamnese.objetivo ? anamnese.objetivo.toLowerCase() : '';
      const frequencia = anamnese.frequencia ? anamnese.frequencia.toLowerCase() : '';
      const restricoes = anamnese.restricoes ? anamnese.restricoes.toLowerCase() : '';

      let volumeSeries = '3 séries de 10 a 12 repetições';
      let metodoTreino = 'Execução padrão com foco em consciência corporal';
      let tempoCardio = '20 minutos pós-treino (Moderado)';
      let tipoCardio = 'Caminhada na esteira ou Bike leve';
      
      if (objetivo.includes('hipertrofia') || objetivo.includes('massa')) {
        volumeSeries = '4 séries de 8 a 12 repetições';
        metodoTreino = 'Foco em falha concêntrica nas duas últimas séries';
        tempoCardio = '15 a 20 min, 3x na semana';
        tipoCardio = 'Esteira leve ou Elíptico';
      } else if (objetivo.includes('emagrec') || objetivo.includes('definicao')) {
        volumeSeries = '3 séries de 15 a 20 repetições';
        metodoTreino = 'Circuito metabólico com descanso reduzido';
        tempoCardio = '30 a 40 minutos pós-treino';
        tipoCardio = 'HIIT na esteira ou Escada';
      } else if (objetivo.includes('força') || objetivo.includes('forca')) {
        volumeSeries = '5 séries de 4 a 6 repetições';
        metodoTreino = 'Carga alta e descanso completo';
        tempoCardio = '10 a 15 minutos leves';
        tipoCardio = 'Bike ergométrica leve';
      }

      // Definição de limites de exercícios por sessão de forma inteligente
      let limiteEx = 4;
      if (objetivo.includes('emagrec') || objetivo.includes('definicao')) {
        limiteEx = 5;
      } else if (objetivo.includes('força') || objetivo.includes('forca')) {
        limiteEx = 3;
      }

      let fichaTreino: Record<string, any> = {};

      if (frequencia.includes('5')) {
        fichaTreino = {
          divisao: 'Divisão ABCDE Profissional (Otimizada)',
          treinos: {
            'Treino A - Peito e Antebraço': [
              ...BANCO_EXERCICIOS.peito.slice(0, limiteEx), 
              ...BANCO_EXERCICIOS.antebraco.slice(0, 1)
            ],
            'Treino B - Costas e Trapézio': [
              ...BANCO_EXERCICIOS.costas.slice(0, limiteEx), 
              ...BANCO_EXERCICIOS.trapezio.slice(0, 1)
            ],
            'Treino C - Quadríceps & Panturrilha': [
              ...BANCO_EXERCICIOS.pernasQuadriceps.slice(0, limiteEx), 
              ...BANCO_EXERCICIOS.panturrilhas.slice(0, 2)
            ],
            'Treino D - Ombros e Core': [
              ...BANCO_EXERCICIOS.ombros.slice(0, 3), 
              ...BANCO_EXERCICIOS.core.slice(0, 2)
            ],
            'Treino E - Posterior + Braços': [
              ...BANCO_EXERCICIOS.pernasPosteriorGluteos.slice(0, 3), 
              ...BANCO_EXERCICIOS.biceps.slice(0, 2), 
              ...BANCO_EXERCICIOS.triceps.slice(0, 2)
            ]
          }
        };
      } else {
        fichaTreino = {
          divisao: 'Divisão ABC (Push, Pull, Legs Equilibrada)',
          treinos: {
            'Treino A (Empurrar)': [
              ...BANCO_EXERCICIOS.peito.slice(0, 3), 
              ...BANCO_EXERCICIOS.ombros.slice(0, 2), 
              ...BANCO_EXERCICIOS.triceps.slice(0, 2)
            ],
            'Treino B (Puxar)': [
              ...BANCO_EXERCICIOS.costas.slice(0, 3), 
              ...BANCO_EXERCICIOS.biceps.slice(0, 2), 
              ...BANCO_EXERCICIOS.trapezio.slice(0, 1)
            ],
            'Treino C (Pernas e Core)': [
              ...BANCO_EXERCICIOS.pernasQuadriceps.slice(0, 3), 
              ...BANCO_EXERCICIOS.pernasPosteriorGluteos.slice(0, 2), 
              ...BANCO_EXERCICIOS.core.slice(0, 2)
            ]
          }
        };
      }

      let alertaRestricao = restricoes && !['nenhuma', 'nao', 'não'].includes(restricoes) 
        ? `Atenção às restrições: "${anamnese.restricoes}"` 
        : null;

      const dadosFichaCompleta = {
        prescricaoTreino: { volumeSeries, metodoAplicado: metodoTreino },
        cardioSugerido: { tempoRecomendado: tempoCardio, diretriz: tipoCardio },
        avisoRestricoes: alertaRestricao,
        fichaTreino
      };

      return res.json({
        sucesso: true,
        aluno: anamnese.nome,
        sexo: anamnese.sexo,
        peso: anamnese.peso,
        altura: anamnese.altura,
        imc: anamnese.imc,
        experiencia: anamnese.experiencia,
        ...dadosFichaCompleta
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ erro: 'Erro ao gerar treino.' });
    }
  };
}
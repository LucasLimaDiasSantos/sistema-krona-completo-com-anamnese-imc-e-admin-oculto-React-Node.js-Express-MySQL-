import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import anamneseRoutes from './routes/anamneseRoutes';
import { setupDatabase } from './config/database';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/status', (req: Request, res: Response) => {
  return res.json({ 
    status: 'online', 
    sistema: 'Krona API',
    mensagem: 'API da Krona rodando com sucesso! 🚀' 
  });
});

app.use('/api', anamneseRoutes);

const PORT = process.env.PORT || 3333;

setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Krona API rodando na porta ${PORT} 🎯`);
  });
}).catch(err => {
  console.error('Falha ao conectar com o MySQL:', err);
});
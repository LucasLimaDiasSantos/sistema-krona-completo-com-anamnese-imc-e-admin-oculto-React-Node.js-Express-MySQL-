import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Cria o pool de conexões usando variáveis de ambiente ou valores padrão locais (XAMPP)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'krona_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function setupDatabase() {
  // Opcional: cria o banco se ele não existir
  const tempConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'krona_db'}`);
  await tempConnection.end();

  // Cria a tabela de anamneses
  const connection = await pool.getConnection();
  await connection.query(`
    CREATE TABLE IF NOT EXISTS anamneses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      idade INT,
      objetivo TEXT NOT NULL,
      frequencia VARCHAR(100),
      restricoes TEXT,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  connection.release();
  console.log('Banco de dados MySQL conectado e tabela configurada com sucesso! 🗄️');
}

export default pool;
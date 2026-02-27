import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'not set',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set'
    }
  });
});

app.post('/api/check-username', (req, res) => {
  const { username } = req.body;
  res.json({ exists: false, username });
});

export default app;

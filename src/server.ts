import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import pool from './config/db';
import { Match, Prediction } from './types';
import sportsApi from './services/sportsApi';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN
}));
app.use(express.json());

// Routes
app.post('/matches', async (req, res) => {
  const { host_id, type, buy_in, questions } = req.body;
  const invite_code = uuidv4().substring(0, 8);

  try {
    const result = await pool.query(
      'INSERT INTO matches (host_id, type, buy_in, invite_code, questions, participants, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING match_id',
      [host_id, type, buy_in, invite_code, JSON.stringify(questions), JSON.stringify([host_id]), 'pending']
    );

    res.json({
      match_id: result.rows[0].match_id,
      invite_code
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

app.post('/matches/:invite_code/join', async (req, res) => {
  const { invite_code } = req.params;
  const { user_id } = req.body;

  try {
    const match = await pool.query('SELECT * FROM matches WHERE invite_code = $1', [invite_code]);
    
    if (match.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const participants = match.rows[0].participants;
    if (!participants.includes(user_id)) {
      participants.push(user_id);
      await pool.query(
        'UPDATE matches SET participants = $1 WHERE invite_code = $2',
        [JSON.stringify(participants), invite_code]
      );
    }

    res.json({
      match_id: match.rows[0].match_id,
      status: 'joined'
    });
  } catch (error) {
    console.error('Error joining match:', error);
    res.status(500).json({ error: 'Failed to join match' });
  }
});

app.post('/matches/:id/predictions', async (req, res) => {
  const { id } = req.params;
  const { user_id, predictions } = req.body;

  try {
    await pool.query(
      'INSERT INTO predictions (match_id, user_id, predictions) VALUES ($1, $2, $3)',
      [id, user_id, JSON.stringify(predictions)]
    );

    res.json({ status: 'submitted' });
  } catch (error) {
    console.error('Error submitting predictions:', error);
    res.status(500).json({ error: 'Failed to submit predictions' });
  }
});

app.get('/matches/:id/results', async (req, res) => {
  const { id } = req.params;

  try {
    const match = await pool.query('SELECT * FROM matches WHERE match_id = $1', [id]);
    const predictions = await pool.query('SELECT * FROM predictions WHERE match_id = $1', [id]);
    
    // Mock results calculation (replace with actual game data integration)
    const scores: Record<string, number> = {};
    predictions.rows.forEach(prediction => {
      scores[prediction.user_id] = Math.floor(Math.random() * 10); // Mock scoring
    });

    const winner = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    await pool.query(
      'UPDATE matches SET status = $1, winner = $2 WHERE match_id = $3',
      ['completed', winner, id]
    );

    res.json({
      match_id: id,
      scores,
      winner
    });
  } catch (error) {
    console.error('Error calculating results:', error);
    res.status(500).json({ error: 'Failed to calculate results' });
  }
});

// Sports API endpoints
app.get('/sports/live-matches', async (req, res) => {
  try {
    const matches = await sportsApi.getLiveMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});

app.get('/sports/predictions/:fixtureId', async (req, res) => {
  try {
    const prediction = await sportsApi.getPrediction(parseInt(req.params.fixtureId));
    res.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ error: 'Failed to fetch prediction' });
  }
});

app.get('/sports/team-stats/:teamId', async (req, res) => {
  try {
    const stats = await sportsApi.getTeamStats(parseInt(req.params.teamId));
    res.json(stats);
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ error: 'Failed to fetch team stats' });
  }
});

app.get('/sports/historical-matches/:teamId', async (req, res) => {
  try {
    const matches = await sportsApi.getHistoricalMatches(parseInt(req.params.teamId));
    res.json(matches);
  } catch (error) {
    console.error('Error fetching historical matches:', error);
    res.status(500).json({ error: 'Failed to fetch historical matches' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

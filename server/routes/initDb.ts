import { RequestHandler } from 'express';
import { initDb } from '../db';


export const handleInitDb: RequestHandler = async (req, res) => {
  try {
    const url = req.body?.url || req.query?.url;
    await initDb(url);
    res.json({ ok: true });
  } catch (e) {
    console.error('init db error', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
};

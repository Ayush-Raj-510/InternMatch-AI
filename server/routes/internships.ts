import { RequestHandler } from 'express';
import { getDb } from '../db';

export const listInternships: RequestHandler = async (_req, res) => {
  try {
    const db = getDb();
    const items = await db.collection('internships').find({}).toArray();
    return res.json({ internships: items });
  } catch (e) {
    console.error('listInternships error', e);
    return res.status(500).json({ error: 'failed to list internships' });
  }
};

import { sanitizeForMongo } from '../lib/sanitize';

export const createInternship: RequestHandler = async (req, res) => {
  try {
    const db = getDb();
    const raw = req.body || {};
    const data = sanitizeForMongo(raw);
    if (!data.id) return res.status(400).json({ error: 'missing id' });
    await db.collection('internships').insertOne(data);
    return res.json({ ok: true });
  } catch (e) {
    console.error('createInternship error', e);
    return res.status(500).json({ error: 'failed to create internship' });
  }
};

export const updateInternship: RequestHandler = async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || '');
    const raw = req.body || {};
    const data = sanitizeForMongo(raw);
    await db.collection('internships').updateOne({ id }, { $set: data }, { upsert: false });
    return res.json({ ok: true });
  } catch (e) {
    console.error('updateInternship error', e);
    return res.status(500).json({ error: 'failed to update internship' });
  }
};

export const deleteInternship: RequestHandler = async (req, res) => {
  try {
    const db = getDb();
    const id = String(req.params.id || '');
    await db.collection('internships').deleteOne({ id });
    return res.json({ ok: true });
  } catch (e) {
    console.error('deleteInternship error', e);
    return res.status(500).json({ error: 'failed to delete internship' });
  }
};

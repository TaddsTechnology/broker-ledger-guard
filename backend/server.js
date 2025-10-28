const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Company Master API routes
app.get('/api/companies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_master ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const { company_code, name, nse_code } = req.body;
    const result = await pool.query(
      'INSERT INTO company_master (company_code, name, nse_code) VALUES ($1, $2, $3) RETURNING *',
      [company_code, name, nse_code]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.put('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_code, name, nse_code } = req.body;
    const result = await pool.query(
      'UPDATE company_master SET company_code = $1, name = $2, nse_code = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [company_code, name, nse_code, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM company_master WHERE id = $1', [id]);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Party Master API routes
app.get('/api/parties', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM party_master ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching parties:', error);
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
});

app.post('/api/parties', async (req, res) => {
  try {
    const { party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'INSERT INTO party_master (party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating party:', error);
    res.status(500).json({ error: 'Failed to create party' });
  }
});

app.put('/api/parties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'UPDATE party_master SET party_code = $1, name = $2, nse_code = $3, ref_code = $4, address = $5, city = $6, phone = $7, trading_slab = $8, delivery_slab = $9, updated_at = NOW() WHERE id = $10 RETURNING *',
      [party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating party:', error);
    res.status(500).json({ error: 'Failed to update party' });
  }
});

app.delete('/api/parties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM party_master WHERE id = $1', [id]);
    res.json({ message: 'Party deleted successfully' });
  } catch (error) {
    console.error('Error deleting party:', error);
    res.status(500).json({ error: 'Failed to delete party' });
  }
});

// Settlement Master API routes
app.get('/api/settlements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settlement_master ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

app.post('/api/settlements', async (req, res) => {
  try {
    const { type, settlement_number, start_date, end_date, contract_no, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO settlement_master (type, settlement_number, start_date, end_date, contract_no, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [type, settlement_number, start_date, end_date, contract_no, notes]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ error: 'Failed to create settlement' });
  }
});

app.put('/api/settlements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, settlement_number, start_date, end_date, contract_no, notes } = req.body;
    const result = await pool.query(
      'UPDATE settlement_master SET type = $1, settlement_number = $2, start_date = $3, end_date = $4, contract_no = $5, notes = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [type, settlement_number, start_date, end_date, contract_no, notes, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settlement:', error);
    res.status(500).json({ error: 'Failed to update settlement' });
  }
});

app.delete('/api/settlements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM settlement_master WHERE id = $1', [id]);
    res.json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    console.error('Error deleting settlement:', error);
    res.status(500).json({ error: 'Failed to delete settlement' });
  }
});

// Bills API routes
app.get('/api/bills', async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT b.*, p.party_code, p.name as party_name 
      FROM bills b 
      LEFT JOIN party_master p ON b.party_id = p.id
    `;
    
    const params = [];
    
    if (type) {
      query += ' WHERE b.bill_type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

app.get('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*, p.party_code, p.name as party_name 
       FROM bills b 
       LEFT JOIN party_master p ON b.party_id = p.id 
       WHERE b.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const { bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type } = req.body;
    const result = await pool.query(
      'INSERT INTO bills (bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type || 'party']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type } = req.body;
    const result = await pool.query(
      'UPDATE bills SET bill_number = $1, party_id = $2, bill_date = $3, due_date = $4, total_amount = $5, notes = $6, bill_type = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type || 'party', id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bills WHERE id = $1', [id]);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Ledger API routes
app.get('/api/ledger', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, p.party_code, p.name as party_name 
      FROM ledger_entries l 
      LEFT JOIN party_master p ON l.party_id = p.id 
      ORDER BY l.entry_date DESC, l.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
});

app.get('/api/ledger/party/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;
    const result = await pool.query(
      'SELECT * FROM ledger_entries WHERE party_id = $1 ORDER BY entry_date DESC, created_at DESC',
      [partyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching party ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch party ledger entries' });
  }
});

app.post('/api/ledger', async (req, res) => {
  try {
    const { party_id, entry_date, particulars, debit_amount, credit_amount, balance } = req.body;
    const result = await pool.query(
      'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [party_id, entry_date, particulars, debit_amount, credit_amount, balance]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({ error: 'Failed to create ledger entry' });
  }
});

app.put('/api/ledger/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { party_id, entry_date, particulars, debit_amount, credit_amount, balance } = req.body;
    const result = await pool.query(
      'UPDATE ledger_entries SET party_id = $1, entry_date = $2, particulars = $3, debit_amount = $4, credit_amount = $5, balance = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [party_id, entry_date, particulars, debit_amount, credit_amount, balance, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    res.status(500).json({ error: 'Failed to update ledger entry' });
  }
});

app.delete('/api/ledger/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ledger_entries WHERE id = $1', [id]);
    res.json({ message: 'Ledger entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    res.status(500).json({ error: 'Failed to delete ledger entry' });
  }
});

// Contracts API routes
app.get('/api/contracts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.party_code, p.name as party_name, s.settlement_number
      FROM contracts c
      LEFT JOIN party_master p ON c.party_id = p.id
      LEFT JOIN settlement_master s ON c.settlement_id = s.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const { contract_number, party_id, settlement_id, contract_date, quantity, rate, amount, contract_type, status, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO contracts (contract_number, party_id, settlement_id, contract_date, quantity, rate, amount, contract_type, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [contract_number, party_id, settlement_id, contract_date, quantity, rate, amount, contract_type, status, notes]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

app.put('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { contract_number, party_id, settlement_id, contract_date, quantity, rate, amount, contract_type, status, notes } = req.body;
    const result = await pool.query(
      'UPDATE contracts SET contract_number = $1, party_id = $2, settlement_id = $3, contract_date = $4, quantity = $5, rate = $6, amount = $7, contract_type = $8, status = $9, notes = $10, updated_at = NOW() WHERE id = $11 RETURNING *',
      [contract_number, party_id, settlement_id, contract_date, quantity, rate, amount, contract_type, status, notes, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

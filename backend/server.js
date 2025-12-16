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

// Cash Transaction API routes
app.delete('/api/cash/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, get the transaction to check if it exists and get its details
    const transactionResult = await pool.query(
      'SELECT * FROM cash_transactions WHERE id = $1',
      [id]
    );
    
    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cash transaction not found' });
    }
    
    // Delete the cash transaction
    await pool.query('DELETE FROM cash_transactions WHERE id = $1', [id]);
    
    res.json({ message: 'Cash transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting cash transaction:', error);
    res.status(500).json({ error: 'Failed to delete cash transaction' });
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
    const { party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab, interest_rate } = req.body;
    const result = await pool.query(
      'INSERT INTO party_master (party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab, interest_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab, interest_rate || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating party:', error);
    res.status(500).json({ error: 'Failed to create party' });
  }
  }
);

app.put('/api/parties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab, interest_rate } = req.body;
    const result = await pool.query(
      'UPDATE party_master SET party_code = $1, name = $2, nse_code = $3, ref_code = $4, address = $5, city = $6, phone = $7, trading_slab = $8, delivery_slab = $9, interest_rate = $10, updated_at = NOW() WHERE id = $11 RETURNING *',
      [party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab, interest_rate || 0, id]
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

// Broker Master API routes
app.get('/api/brokers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM broker_master ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

app.post('/api/brokers', async (req, res) => {
  try {
    const { broker_code, name, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'INSERT INTO broker_master (broker_code, name, address, city, phone, trading_slab, delivery_slab) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [broker_code, name, address, city, phone, trading_slab, delivery_slab]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating broker:', error);
    res.status(500).json({ error: 'Failed to create broker' });
  }
});

app.put('/api/brokers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { broker_code, name, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'UPDATE broker_master SET broker_code = $1, name = $2, address = $3, city = $4, phone = $5, trading_slab = $6, delivery_slab = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [broker_code, name, address, city, phone, trading_slab, delivery_slab, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating broker:', error);
    res.status(500).json({ error: 'Failed to update broker' });
  }
});

app.delete('/api/brokers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM broker_master WHERE id = $1', [id]);
    res.json({ message: 'Broker deleted successfully' });
  } catch (error) {
    console.error('Error deleting broker:', error);
    res.status(500).json({ error: 'Failed to delete broker' });
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
    const { type, from_date, to_date } = req.query;
    
    let query = `
      SELECT b.*, p.party_code, p.name as party_name 
      FROM bills b 
      LEFT JOIN party_master p ON b.party_id = p.id
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Add WHERE clause if we have any filters
    let hasWhereClause = false;
    
    if (type) {
      query += ` WHERE b.bill_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
      hasWhereClause = true;
    }
    
    if (from_date) {
      query += hasWhereClause ? ` AND b.bill_date >= $${paramIndex}` : ` WHERE b.bill_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
      hasWhereClause = true;
    }
    
    if (to_date) {
      query += hasWhereClause ? ` AND b.bill_date <= $${paramIndex}` : ` WHERE b.bill_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    query += ' ORDER BY b.bill_date DESC, b.created_at DESC';
    
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
      `SELECT b.*, p.party_code, p.name as party_name, bm.name as broker_name
       FROM bills b 
       LEFT JOIN party_master p ON b.party_id = p.id 
       LEFT JOIN broker_master bm ON bm.broker_code = b.broker_code
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

app.get('/api/bills/by-number/:billNumber', async (req, res) => {
  try {
    const { billNumber } = req.params;
    const result = await pool.query(
      `SELECT b.*, p.party_code, p.name as party_name, bm.name as broker_name
       FROM bills b 
       LEFT JOIN party_master p ON b.party_id = p.id 
       LEFT JOIN broker_master bm ON bm.broker_code = b.broker_code
       WHERE b.bill_number = $1`,
      [billNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching bill by number:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const { bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type } = req.body;
    // Handle null party_id for broker bills
    const partyIdValue = party_id || null;
    console.log('Creating bill with data:', { bill_number, party_id: partyIdValue, bill_date, due_date, total_amount, notes, bill_type });
    const result = await pool.query(
      'INSERT INTO bills (bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [bill_number, partyIdValue, bill_date, due_date, total_amount, notes, bill_type || 'party']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill', details: error.message });
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
    // Check if it's a foreign key constraint error (bill is referenced by contracts)
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete this bill. Please delete the associated contracts first.' });
    }
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Get bill items
app.get('/api/bills/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT bi.*, cm.name as company_name, cm.nse_code as company_nse_code
       FROM bill_items bi
       LEFT JOIN company_master cm ON bi.company_code = cm.company_code
       WHERE bi.bill_id = $1
       ORDER BY bi.id ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bill items:', error);
    res.status(500).json({ error: 'Failed to fetch bill items' });
  }
});

// Add endpoint to get outstanding bills for a party
app.get('/api/bills/outstanding/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;
    
    // Validate party exists
    const partyResult = await pool.query(
      'SELECT id FROM party_master WHERE id = $1',
      [partyId]
    );
    
    if (partyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Get bills that are not fully paid
    const result = await pool.query(
      `SELECT id, bill_number, total_amount, paid_amount, status
       FROM bills 
       WHERE party_id = $1 AND status != 'paid'
       ORDER BY created_at DESC`,
      [partyId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    res.status(500).json({ error: 'Failed to fetch outstanding bills' });
  }
});

// Get outstanding F&O bills for a party
app.get('/api/fo/bills/outstanding/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;
    
    const partyResult = await pool.query(
      'SELECT id FROM party_master WHERE id = $1',
      [partyId]
    );
    
    if (partyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    const result = await pool.query(
      `SELECT id, bill_number, total_amount, paid_amount, status
       FROM fo_bills
       WHERE party_id = $1 AND status != 'paid'
       ORDER BY created_at DESC`,
      [partyId]
    );
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O outstanding bills:', error);
    res.status(500).json({ error: 'Failed to fetch F&O outstanding bills' });
  }
});

// Ledger API routes
app.get('/api/ledger', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    let query = `
      SELECT l.*, p.party_code, p.name as party_name 
      FROM ledger_entries l 
      LEFT JOIN party_master p ON l.party_id = p.id 
    `;
    
    const queryParams = [];
    
    if (from_date || to_date) {
      query += ' WHERE 1=1';
      
      if (from_date) {
        queryParams.push(from_date);
        query += ` AND l.entry_date >= $${queryParams.length}`;
      }
      
      if (to_date) {
        queryParams.push(to_date);
        query += ` AND l.entry_date <= $${queryParams.length}`;
      }
    }
    
    query += ' ORDER BY l.entry_date DESC, l.created_at DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
});

app.get('/api/ledger/party/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;
    const { from_date, to_date } = req.query;
    
    let query = 'SELECT * FROM ledger_entries WHERE party_id = $1';
    const queryParams = [partyId];
    
    if (from_date || to_date) {
      if (from_date) {
        queryParams.push(from_date);
        query += ` AND entry_date >= $${queryParams.length}`;
      }
      
      if (to_date) {
        queryParams.push(to_date);
        query += ` AND entry_date <= $${queryParams.length}`;
      }
    }
    
    query += ' ORDER BY entry_date DESC, created_at DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching party ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch party ledger entries' });
  }
});

app.post('/api/ledger', async (req, res) => {
  try {
    const { party_id, entry_date, particulars, debit_amount, credit_amount, balance } = req.body;
    // Handle null party_id for broker ledger entries
    const partyIdValue = party_id || null;
    console.log('Creating ledger entry with data:', { party_id: partyIdValue, entry_date, particulars, debit_amount, credit_amount, balance });
    const result = await pool.query(
      'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [partyIdValue, entry_date, particulars, debit_amount, credit_amount, balance]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({ error: 'Failed to create ledger entry', details: error.message });
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
      SELECT c.*, p.party_code, p.name as party_name, s.settlement_number, b.name as broker_name
      FROM contracts c
      LEFT JOIN party_master p ON c.party_id = p.id
      LEFT JOIN settlement_master s ON c.settlement_id = s.id
      LEFT JOIN broker_master b ON c.broker_id = b.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

app.get('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM contracts WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const { contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type } = req.body;
    const result = await pool.query(
      'INSERT INTO contracts (contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
      [contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type]
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
    const { contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type } = req.body;
    const result = await pool.query(
      'UPDATE contracts SET contract_number = $1, party_id = $2, settlement_id = $3, broker_id = $4, broker_code = $5, contract_date = $6, quantity = $7, rate = $8, amount = $9, contract_type = $10, brokerage_rate = $11, brokerage_amount = $12, status = $13, notes = $14, company_id = $15, trade_type = $16, updated_at = NOW() WHERE id = $17 RETURNING *',
      [contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type, id]
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

// Batch create contracts with automatic bill generation
app.post('/api/contracts/batch', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { contracts } = req.body;
    
    if (!Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: 'contracts must be a non-empty array' });
    }
    
    const now = new Date();
    // Always use system date for bill date
    const billDateStr = now.toISOString().slice(0, 10);
    
    // Pre-compute next contract number once to avoid duplicates
    const lastNumberResult = await client.query(`
      SELECT MAX((regexp_match(contract_number, '(\\d+)$'))[1]::INT) AS last_no
      FROM contracts
      WHERE contract_number ~ '(\\d+)$'
    `);
    let nextNumber = (lastNumberResult.rows[0]?.last_no || 0) + 1;
    
    // Group contracts by party and broker
    const partyGroups = {};
    const brokerGroups = {};
    
    const createdContracts = [];
    
    for (const contract of contracts) {
      const { party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type } = contract;
      
      // Generate sequential contract number based on pre-computed nextNumber
      const contract_number = String(nextNumber).padStart(3, '0');
      nextNumber++;
      
      // Insert contract
      const contractResult = await client.query(
        'INSERT INTO contracts (contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
        [contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status || 'active', notes, company_id, trade_type]
      );
      
      const createdContract = contractResult.rows[0];
      createdContracts.push(createdContract);
      
      // Group by party for party bills
      if (!partyGroups[party_id]) {
        partyGroups[party_id] = [];
      }
      partyGroups[party_id].push(createdContract);
      
      // Group by broker for broker bills
      if (broker_id) {
        if (!brokerGroups[broker_id]) {
          brokerGroups[broker_id] = [];
        }
        brokerGroups[broker_id].push(createdContract);
      }
    }
    
    const partyBills = [];
    const brokerBills = [];
    const ledgerEntries = [];
    
    // Create party bills and ledger entries
    for (const [party_id, partyContracts] of Object.entries(partyGroups)) {
      // Get party details
      const partyQuery = await client.query(
        'SELECT id, party_code, name FROM party_master WHERE id = $1',
        [party_id]
      );
      
      if (partyQuery.rows.length === 0) {
        continue;
      }
      
      const party = partyQuery.rows[0];
      
      // Calculate totals
      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      let totalBrokerage = 0;
      
      for (const contract of partyContracts) {
        const amount = Number(contract.amount) || 0;
        const brokerage = Number(contract.brokerage_amount) || 0;
        
        if (contract.contract_type === 'buy') {
          totalBuyAmount += amount;
        } else if (contract.contract_type === 'sell') {
          totalSellAmount += amount;
        }
        
        totalBrokerage += brokerage;
      }
      
      // Calculate net amount: (Buy - Sell) + Brokerage
      const netTradeAmount = totalBuyAmount - totalSellAmount;
      const finalAmount = netTradeAmount + totalBrokerage;
      
      // Generate party bill number
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      const billNumber = `PTY${y}${m}${d}-${suffix}`;
      
      // Create party bill
      const billResult = await client.query(
        'INSERT INTO bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [billNumber, party_id, billDateStr, finalAmount, 'party', 'pending']
      );
      
      const bill = billResult.rows[0];
      partyBills.push(bill);
      
      // Update contracts with party_bill_id
      for (const contract of partyContracts) {
        await client.query(
          'UPDATE contracts SET party_bill_id = $1, bill_generated = TRUE WHERE id = $2',
          [bill.id, contract.id]
        );
      }
      
      // Create bill items
      for (const contract of partyContracts) {
        // Get company information if company_id exists
        let companyName = null;
        let companyCode = null;
        if (contract.company_id) {
          const companyQuery = await client.query(
            'SELECT company_code, name FROM company_master WHERE id = $1',
            [contract.company_id]
          );
          if (companyQuery.rows.length > 0) {
            companyCode = companyQuery.rows[0].company_code;
            companyName = companyQuery.rows[0].name;
          }
        }
        
        // Use company name if available, otherwise fall back to contract number
        const description = companyName 
          ? `${companyCode} - ${companyName}` 
          : `Contract ${contract.contract_number} - ${contract.contract_type.toUpperCase()}`;
        
        await client.query(
          'INSERT INTO bill_items (bill_id, description, quantity, rate, amount, brokerage_rate_pct, brokerage_amount, company_code, client_code, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            bill.id,
            description,
            contract.quantity,
            contract.rate,
            contract.amount,
            contract.brokerage_rate,
            contract.brokerage_amount,
            companyCode,
            party.party_code,
            contract.trade_type
          ]
        );
      }
      
      // Get current client balance
      let currentBalance = 0;
      const balanceQuery = await client.query(
        'SELECT balance FROM ledger_entries WHERE party_id = $1 AND reference_type = $2 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        [party_id, 'client_settlement']
      );
      if (balanceQuery.rows.length > 0) {
        currentBalance = Number(balanceQuery.rows[0].balance) || 0;
      }
      
      const newBalance = currentBalance + finalAmount;
      
      // Create ledger entry
      const debitAmount = finalAmount > 0 ? finalAmount : 0;
      const creditAmount = finalAmount < 0 ? Math.abs(finalAmount) : 0;
      
      const ledgerResult = await client.query(
        'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          party_id,
          billDateStr,
          `Bill ${billNumber} - Buy: ₹${totalBuyAmount.toFixed(2)}, Sell: ₹${totalSellAmount.toFixed(2)}, Brokerage: ₹${totalBrokerage.toFixed(2)} (${partyContracts.length} contracts)`,
          debitAmount,
          creditAmount,
          newBalance,
          'client_settlement',
          bill.id
        ]
      );
      
      ledgerEntries.push(ledgerResult.rows[0]);
    }
    
    // Create broker bills
    for (const [broker_id, brokerContracts] of Object.entries(brokerGroups)) {
      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      let totalSubBrokerBrokerage = 0;
      
      // Get broker details to check broker's rate
      const brokerDetailsQuery = await client.query(
        'SELECT trading_slab, delivery_slab FROM broker_master WHERE id = $1',
        [broker_id]
      );
      
      const brokerTradingSlab = brokerDetailsQuery.rows.length > 0 
        ? Number(brokerDetailsQuery.rows[0].trading_slab) 
        : 0.03; // Default 0.03% if not found
      
      for (const contract of brokerContracts) {
        const amount = Number(contract.amount) || 0;
        
        if (contract.contract_type === 'buy') {
          totalBuyAmount += amount;
        } else if (contract.contract_type === 'sell') {
          totalSellAmount += amount;
        }
        
        // This is sub-broker's brokerage (1%)
        totalSubBrokerBrokerage += Number(contract.brokerage_amount) || 0;
      }
      
      // Calculate net trade amount and broker's share
      const netTradeAmount = totalBuyAmount - totalSellAmount;
      const brokerBrokerageAmount = Math.abs(netTradeAmount) * (brokerTradingSlab / 100);
      
      // Main broker bill = Net trade amount + Broker's brokerage
      const mainBrokerBillTotal = Math.abs(netTradeAmount) + brokerBrokerageAmount;
      
      // Generate broker bill number
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      const brokerBillNumber = `BRK${y}${m}${d}-${suffix}`;
      
      // Get broker code
      const brokerCode = brokerContracts[0].broker_code;
      
      // Create broker bill with full amount (net trade + broker's brokerage)
      const brokerBillResult = await client.query(
        'INSERT INTO bills (bill_number, broker_id, broker_code, bill_date, total_amount, bill_type, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          brokerBillNumber,
          broker_id,
          brokerCode,
          billDateStr,
          mainBrokerBillTotal,
          'broker',
          'pending',
          `Net Trade: ₹${Math.abs(netTradeAmount).toFixed(2)} + Broker Brokerage (${brokerTradingSlab}%): ₹${brokerBrokerageAmount.toFixed(2)}`
        ]
      );
      
      const brokerBill = brokerBillResult.rows[0];
      brokerBills.push(brokerBill);
      
      // Update contracts with broker_bill_id
      for (const contract of brokerContracts) {
        await client.query(
          'UPDATE contracts SET broker_bill_id = $1 WHERE id = $2',
          [brokerBill.id, contract.id]
        );
      }
      
      // Create broker bill items
      for (const contract of brokerContracts) {
        // Get company information if company_id exists
        let companyName = null;
        let companyCode = null;
        if (contract.company_id) {
          const companyQuery = await client.query(
            'SELECT company_code, name FROM company_master WHERE id = $1',
            [contract.company_id]
          );
          if (companyQuery.rows.length > 0) {
            companyCode = companyQuery.rows[0].company_code;
            companyName = companyQuery.rows[0].name;
          }
        }
        
        // Get party code for client_code
        let clientCode = null;
        if (contract.party_id) {
          const partyQuery = await client.query(
            'SELECT party_code FROM party_master WHERE id = $1',
            [contract.party_id]
          );
          if (partyQuery.rows.length > 0) {
            clientCode = partyQuery.rows[0].party_code;
          }
        }
        
        // Use company name if available, otherwise fall back to contract number
        const description = companyName 
          ? `${companyCode} - ${companyName}` 
          : `Contract ${contract.contract_number} - Brokerage`;
        
        await client.query(
          'INSERT INTO bill_items (bill_id, description, quantity, rate, amount, brokerage_rate_pct, brokerage_amount, company_code, client_code, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            brokerBill.id,
            description,
            contract.quantity,
            contract.rate,
            contract.amount,
            contract.brokerage_rate,
            contract.brokerage_amount,
            companyCode,
            clientCode,
            contract.trade_type
          ]
        );
      }
      
      // Get current broker balance
      let brokerBalance = 0;
      const brokerBalanceQuery = await client.query(
        'SELECT balance FROM ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['broker_brokerage']
      );
      if (brokerBalanceQuery.rows.length > 0) {
        brokerBalance = Number(brokerBalanceQuery.rows[0].balance) || 0;
      }
      
      // Track full broker bill (net trade + brokerage) in the broker ledger balance
      brokerBalance += mainBrokerBillTotal;
      
      // Create broker ledger entry with full amount as credit (net trade + brokerage)
      const brokerLedgerResult = await client.query(
        'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Main Broker Bill ${brokerBillNumber} - Net Trade: ₹${Math.abs(netTradeAmount).toFixed(2)} + Brokerage: ₹${brokerBrokerageAmount.toFixed(2)}`,
          0,
          mainBrokerBillTotal,
          brokerBalance,
          'broker_brokerage',
          brokerBill.id
        ]
      );
      
      ledgerEntries.push(brokerLedgerResult.rows[0]);
      
      // Calculate sub-broker profit (difference between sub-broker brokerage and main broker brokerage)
      const subBrokerProfit = totalSubBrokerBrokerage - brokerBrokerageAmount;
      
      // Get current sub-broker profit balance
      let subBrokerProfitBalance = 0;
      const profitBalanceQuery = await client.query(
        'SELECT balance FROM ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['sub_broker_profit']
      );
      if (profitBalanceQuery.rows.length > 0) {
        subBrokerProfitBalance = Number(profitBalanceQuery.rows[0].balance) || 0;
      }
      
      subBrokerProfitBalance += subBrokerProfit;
      
      // Create sub-broker profit ledger entry (3rd entry)
      const profitLedgerResult = await client.query(
        'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Sub-Broker Profit - Bill ${brokerBillNumber} - Sub-broker: ₹${totalSubBrokerBrokerage.toFixed(2)}, Main Broker: ₹${brokerBrokerageAmount.toFixed(2)}, Profit: ₹${subBrokerProfit.toFixed(2)}`,
          0,
          subBrokerProfit,
          subBrokerProfitBalance,
          'sub_broker_profit',
          brokerBill.id
        ]
      );
      
      ledgerEntries.push(profitLedgerResult.rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Contracts created and bills generated successfully',
      contracts: createdContracts,
      partyBills,
      brokerBills,
      ledgerEntries
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating batch contracts:', error);
    res.status(500).json({ error: 'Failed to create contracts', details: error.message });
  } finally {
    client.release();
  }
});

// Utility: derive company code/name from SecurityName (best-effort)
function extractCompanyFromSecurityName(securityName = "") {
  // Examples: CYIENT25OCTFUT, SBIN25NOVFUT, APLAPOLLO25NOVFUT, NIFTY25OCT24800PE
  const match = securityName.match(/^[A-Z]+/i);
  const code = (match ? match[0] : securityName).replace(/[^A-Z]/gi, '').toUpperCase();
  return {
    company_code: code || null,
    company_name: code || null,
  };
}

// Fetch trading and delivery slabs for a list of client (party) ids
async function getPartySlabs(clientIds = []) {
  if (!Array.isArray(clientIds) || clientIds.length === 0) return {};
  const uniq = Array.from(new Set(clientIds.filter(Boolean)));
  if (uniq.length === 0) return {};
  try {
    const placeholders = uniq.map((_, i) => `$${i + 1}`).join(',');
    const sql = `SELECT party_code, trading_slab, delivery_slab FROM party_master WHERE party_code IN (${placeholders})`;
    const result = await pool.query(sql, uniq);
    const map = {};
    for (const row of result.rows) {
      map[row.party_code] = {
        trading: Number(row.trading_slab ?? 0),
        delivery: Number(row.delivery_slab ?? 0),
      };
    }
    return map;
  } catch (e) {
    console.error('Error fetching party slabs:', e);
    return {};
  }
}

// Compute brokerage for a row given party slabs and row type (T/D)
function computeBrokerageForRow(row, partySlabMap) {
  const clientId = row.clientId || '';
  const slabs = partySlabMap[clientId] || { trading: 0, delivery: 0 };
  const type = (row.type || '').toUpperCase();
  const ratePct = type === 'T' ? slabs.trading : type === 'D' ? slabs.delivery : 0;
  const rate = Number(ratePct) / 100;
  const brokerage = (Number(row.amount) || 0) * rate;
  return { brokerageRatePct: ratePct, brokerageAmount: brokerage };
}

// POST /api/bills/preview
// Body: { rows: Array<CSVRowLike> }
// Returns grouped broker bills; if only one broker, one broker bill with all clients
app.post('/api/bills/preview', async (req, res) => {
  try {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }

      const inputRows = Array.isArray(body?.rows) ? body.rows : [];
      if (inputRows.length === 0) {
        return res.status(400).json({ error: 'rows must be a non-empty array' });
      }

      // Normalize rows and compute amount
      const rows = inputRows.map(normalizeRow).map((r) => ({
        ...r,
        amount: r.quantity * r.price,
        ...extractCompanyFromSecurityName(r.securityName),
      }));

      // Load party slabs for involved clients
      const uniqueClients = Array.from(new Set(rows.map(r => r.clientId).filter(Boolean)));
      const partySlabMap = await getPartySlabs(uniqueClients);

      // Add brokerage per item based on Type and party slabs
      const rowsWithBrokerage = rows.map((r) => {
        const { brokerageRatePct, brokerageAmount } = computeBrokerageForRow(r, partySlabMap);
        return { ...r, brokerage_rate_pct: brokerageRatePct, brokerage_amount: brokerageAmount };
      });

      // Group by broker
      const brokerIdToRows = rowsWithBrokerage.reduce((acc, r) => {
        if (!r.brokerId) return acc;
        if (!acc[r.brokerId]) acc[r.brokerId] = [];
        acc[r.brokerId].push(r);
        return acc;
      }, {});

      const brokers = Object.keys(brokerIdToRows);
      const mode = brokers.length === 1 ? 'single_broker' : 'multi_broker';

      // Build bills per broker, aggregating client rows
      const billsRaw = brokers.map((brokerId) => {
        const bRows = brokerIdToRows[brokerId];
        const clientSet = new Set(bRows.map((r) => r.clientId).filter(Boolean));
        const companyCodeSet = new Set(bRows.map((r) => r.company_code).filter(Boolean));

        return {
          brokerId,
          clients: Array.from(clientSet),
          items: bRows.map((r) => ({
            expiryDate: r.expiryDate,
            securityName: r.securityName,
            side: r.side,
            quantity: r.quantity,
            price: r.price,
            amount: r.amount,
            clientId: r.clientId,
            company_code: r.company_code,
            company_name: r.company_name,
            type: r.type,
            brokerage_rate_pct: r.brokerage_rate_pct,
            brokerage_amount: r.brokerage_amount,
          })),
          summary: {
            totalQuantity: bRows.reduce((s, r) => s + (Number.isFinite(r.quantity) ? r.quantity : 0), 0),
            totalAmount: bRows.reduce((s, r) => s + (Number.isFinite(r.amount) ? r.amount : 0), 0),
            totalBrokerage: bRows.reduce((s, r) => s + (Number.isFinite(r.brokerage_amount) ? r.brokerage_amount : 0), 0),
            numClients: clientSet.size,
            numCompanies: companyCodeSet.size,
            numItems: bRows.length,
          },
        };
      });

      // Final safety: consolidate any duplicate brokerId entries into a single bill
      const brokerIdToBill = new Map();
      for (const b of billsRaw) {
        const key = (b.brokerId || '').toString().trim().toUpperCase();
        if (!brokerIdToBill.has(key)) {
          brokerIdToBill.set(key, { ...b, clients: new Set(b.clients) });
        } else {
          const agg = brokerIdToBill.get(key);
          // Merge clients
          for (const c of b.clients) agg.clients.add(c);
          // Merge items
          agg.items = [...agg.items, ...b.items];
          // Merge summary
          agg.summary.totalQuantity += b.summary.totalQuantity;
          agg.summary.totalAmount += b.summary.totalAmount;
          agg.summary.totalBrokerage += b.summary.totalBrokerage;
          agg.summary.numItems += b.summary.numItems;
          agg.summary.numClients = new Set([...agg.clients]).size;
          agg.summary.numCompanies += b.summary.numCompanies; // approximate; could dedupe by company codes if needed
        }
      }
      const bills = Array.from(brokerIdToBill.values()).map((b) => ({
        ...b,
        clients: Array.from(b.clients),
      }));

      return res.json({
        mode,
        brokers: bills.length,
        bills,
      });
    });
  } catch (error) {
    console.error('Error generating bill preview:', error);
    res.status(500).json({ error: 'Failed to generate bill preview' });
  }
});

// Create a consolidated broker bill (single bill for one broker with all client items)
app.post('/api/bills/create-broker', async (req, res) => {
  try {
    const { brokerId, brokerCode, billDate, dueDate, items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items are required' });
    }

    // Determine broker code (prefer brokerCode arg, fallback to brokerId)
    const normBrokerCode = ((brokerCode || brokerId) || '').toString().trim().toUpperCase();
    if (!normBrokerCode) {
      return res.status(400).json({ error: 'brokerCode or brokerId is required' });
    }

    // Resolve broker_id by broker_code if present in broker_master
    let broker_id = null;
    try {
      const q = await pool.query('SELECT id FROM broker_master WHERE UPPER(broker_code) = $1 LIMIT 1', [normBrokerCode]);
      broker_id = q.rows?.[0]?.id || null;
    } catch (_) {}

    // Compute totals
    const totalAmount = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

    // Dates
    const now = new Date();
    const billDateStr = billDate || now.toISOString().slice(0, 10);
    const dueDateStr = dueDate || null;

    // Upsert behavior: if a broker bill exists for same broker_code + bill_date, append to it
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Existing bill lookup
      const existing = await client.query(
        `SELECT id FROM bills WHERE bill_type = 'broker' AND UPPER(broker_code) = $1 AND bill_date = $2 LIMIT 1`,
        [normBrokerCode, billDateStr]
      );

      let billId;
      if (existing.rows.length > 0) {
        billId = existing.rows[0].id;
        // Update totals
        await client.query(`UPDATE bills SET total_amount = total_amount + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [totalAmount, billId]);
      } else {
        // Create new bill number
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const suffix = String(Math.floor(Math.random() * 900) + 100);
        const billNumber = `BRK${y}${m}${d}-${suffix}`;

        const insertBill = `INSERT INTO bills (bill_number, party_id, broker_id, broker_code, bill_date, due_date, total_amount, paid_amount, status, notes, bill_type)
                            VALUES ($1, NULL, $2, $3, $4, $5, $6, 0.00, 'pending', NULL, 'broker') RETURNING id`;
        const billRes = await client.query(insertBill, [
          billNumber,
          broker_id,
          normBrokerCode,
          billDateStr,
          dueDateStr,
          totalAmount,
        ]);
        billId = billRes.rows[0].id;
      }

      const insertItem = `INSERT INTO bill_items (bill_id, description, quantity, rate, amount, client_code, company_code, brokerage_rate_pct, brokerage_amount, trade_type)
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
      for (const it of items) {
        // Use company_name if available, otherwise securityName or company_code
        const description = it.company_name 
          ? `${it.company_code} - ${it.company_name}` 
          : (it.securityName || `${it.company_code || ''}`);
        
        await client.query(insertItem, [
          billId,
          description,
          Number(it.quantity) || 0,
          Number(it.price) || 0,
          Number(it.amount) || 0,
          (it.clientId || '').toString().trim().toUpperCase(),
          (it.company_code || null),
          Number(it.brokerage_rate_pct) || 0,
          Number(it.brokerage_amount) || 0,
          (it.type || it.trade_type || null),
        ]);
      }

      await client.query('COMMIT');
      return res.json({ ok: true, bill_id: billId });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Error creating broker bill:', e);
      return res.status(500).json({ error: 'Failed to create broker bill' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in create-broker:', error);
    res.status(500).json({ error: 'Failed to create broker bill' });
  }
});

// List bills; supports type=broker to fetch consolidated broker bills only
app.get('/api/bills', async (req, res) => {
  try {
    const type = (req.query.type || '').toString();
    if (type === 'broker') {
      const q = await pool.query(`
        SELECT b.id, b.bill_number, b.broker_code, bm.name AS broker_name, 
               b.bill_date, b.due_date, b.total_amount, b.status, b.bill_type
        FROM bills b
        LEFT JOIN broker_master bm ON bm.broker_code = b.broker_code
        WHERE b.bill_type = 'broker'
        ORDER BY b.bill_date DESC, b.created_at DESC
      `);
      return res.json(q.rows || []);
    }
    // default: return party bills
    const q = await pool.query(`
      SELECT b.id, b.bill_number, p.party_code, p.name AS party_name,
             b.bill_date, b.due_date, b.total_amount, b.status, b.bill_type
      FROM bills b
      LEFT JOIN party_master p ON p.id = b.party_id
      WHERE b.bill_type = 'party'
      ORDER BY b.bill_date DESC, b.created_at DESC
    `);
    return res.json(q.rows || []);
  } catch (e) {
    console.error('Error fetching bills:', e);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Process stock trades and create ledger entries
app.post('/api/stock-trades/process', async (req, res) => {
  const client = await pool.connect();
  try {
    const { trades, billDate } = req.body;
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'trades array is required' });
    }

    await client.query('BEGIN');

    const results = {
      clientBills: [],
      brokerEntries: [],
      ledgerEntries: [],
    };

    // Collect bill items per broker for broker bills
    // brokerGroups[brokerCode] = { items: [], totalBrokerageAllClients: 0 }
    const brokerGroups = {};

    // Group trades by client
    const clientGroups = {};
    for (const trade of trades) {
      const clientId = (trade.ClientId || trade.clientId || '').toString().trim().toUpperCase();
      if (!clientId) continue;
      
      if (!clientGroups[clientId]) clientGroups[clientId] = [];
      clientGroups[clientId].push(trade);
    }

    const now = new Date();
    // Use user-provided billDate if possible; accept YYYY-MM-DD or DD-MM-YYYY / DD/MM/YYYY
    let billDateStr = now.toISOString().slice(0, 10);
    if (typeof billDate === 'string') {
      const trimmed = billDate.trim();
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        billDateStr = trimmed;
      } else {
        // Try DD-MM-YYYY or DD/MM/YYYY → convert to YYYY-MM-DD
        const m = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
        if (m) {
          const [_, dd, mm, yyyy] = m;
          billDateStr = `${yyyy}-${mm}-${dd}`;
        }
      }
    }

    // Process each client
    for (const [clientId, clientTrades] of Object.entries(clientGroups)) {
      // Get party details
      const partyQuery = await client.query(
        'SELECT id, party_code, name, trading_slab, delivery_slab FROM party_master WHERE UPPER(party_code) = $1',
        [clientId]
      );

      if (partyQuery.rows.length === 0) {
        console.warn(`Party not found: ${clientId}`);
        continue;
      }

      const party = partyQuery.rows[0];
      let totalBrokerage = 0;
      
      // Get current balance by recalculating from ALL entries (not just last one)
      // This ensures correct balance even when bills are created out of chronological order
      let currentClientBalance = 0;
      const allEntriesQuery = await client.query(
        `SELECT debit_amount, credit_amount 
         FROM ledger_entries 
         WHERE party_id = $1 
         ORDER BY entry_date ASC, created_at ASC`,
        [party.id]
      );
      
      // Recalculate running balance from all entries
      for (const entry of allEntriesQuery.rows) {
        const debit = Number(entry.debit_amount) || 0;
        const credit = Number(entry.credit_amount) || 0;
        currentClientBalance = currentClientBalance + debit - credit;
      }

      // Get current BROKERAGE balance (not trade settlement balance)
      let brokerageBalance = 0;
      const brokerageBalanceQuery = await client.query(
        'SELECT balance FROM ledger_entries WHERE party_id = $1 AND reference_type = $2 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        [party.id, 'brokerage']
      );
      if (brokerageBalanceQuery.rows.length > 0) {
        brokerageBalance = Number(brokerageBalanceQuery.rows[0].balance) || 0;
      }

      const billItems = [];
      const carryForwardItems = [];
      let totalBuyAmount = 0;
      let totalSellAmount = 0;

      // Process each trade
      for (const trade of clientTrades) {
        const securityName = trade.SecurityName || trade.securityName || '';
        const tradeDateValue = trade.TradeDate || trade.tradeDate || trade.Date || billDateStr;

        // Normalise side (BUY/SELL). If missing, infer from BuyQty/SellQty.
        let side = (trade.Side || trade.side || '').toString().toUpperCase();
        const rawBuyQty = Number(trade.BuyQty || trade.buyQty || 0);
        const rawSellQty = Number(trade.SellQty || trade.sellQty || 0);
        if (!side) {
          if (rawBuyQty > 0 && rawSellQty === 0) {
            side = 'BUY';
          } else if (rawSellQty > 0 && rawBuyQty === 0) {
            side = 'SELL';
          }
        }
        
        // Get quantity based on side
        let quantity = 0;
        if (side === 'BUY') {
          quantity = rawBuyQty || Number(trade.Quantity || trade.quantity || 0);
        } else if (side === 'SELL') {
          quantity = rawSellQty || Number(trade.Quantity || trade.quantity || 0);
        } else {
          quantity = rawBuyQty || rawSellQty || Number(trade.Quantity || trade.quantity || 0);
        }
        
        // Get price based on side
        let price = 0;
        if (side === 'BUY') {
          price = Number(trade.BuyAvg || trade.buyAvg || trade.Price || trade.price || 0);
        } else if (side === 'SELL') {
          price = Number(trade.SellAvg || trade.sellAvg || trade.Price || trade.price || 0);
        } else {
          price = Number(trade.BuyAvg || trade.SellAvg || trade.Price || trade.price || 0);
        }
        
        const type = (trade.Type || trade.type || '').toString().toUpperCase();
        const isCarryForward = type === 'CF';
        const amount = quantity * price;
        
        // Skip if quantity or price is 0
        if (quantity === 0 || price === 0) {
          console.warn(`Skipping trade with zero quantity or price: ${securityName}`);
          continue;
        }

        // Calculate brokerage
        const brokerageRate = type === 'T' ? Number(party.trading_slab) : Number(party.delivery_slab);
        const brokerageAmount = isCarryForward ? 0 : (amount * brokerageRate) / 100;
        if (!isCarryForward) {
          totalBrokerage += brokerageAmount;
        }

        // Track buy/sell amounts for trade settlement ledger (non-CF only)
        if (!isCarryForward) {
          if (side === 'BUY') {
            totalBuyAmount += amount;
          } else if (side === 'SELL') {
            totalSellAmount += amount;
          }
        }

        // Capture broker code per trade (so one client can trade via multiple brokers)
        const brokerCodeFromTrade = (trade.brokerid || trade.brokerId || trade.BrokerId || trade.BrokerID || '').toString().trim().toUpperCase();

        const tradeItem = {
          description: `${securityName} - ${side}`,
          quantity,
          rate: price,
          amount,
          client_code: clientId,
          company_code: extractCompanyFromSecurityName(securityName).company_code,
          brokerage_rate_pct: brokerageRate,
          brokerage_amount: brokerageAmount,
          trade_type: type,
          broker_code: brokerCodeFromTrade || null,
        };

        if (isCarryForward) {
          carryForwardItems.push(tradeItem);

          const debitAmountCF = side === 'BUY' ? amount : 0;
          const creditAmountCF = side === 'SELL' ? amount : 0;
          currentClientBalance = currentClientBalance + debitAmountCF - creditAmountCF;
          const cfLedgerResult = await client.query(
            'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [
              party.id,
              tradeDateValue,
              `Carry Forward ${side} - ${securityName} (${quantity} @ ?${price.toFixed(2)})`,
              debitAmountCF,
              creditAmountCF,
              currentClientBalance,
              'carry_forward',
              null
            ]
          );
          results.ledgerEntries.push(cfLedgerResult.rows[0]);
        } else {
          billItems.push(tradeItem);
        }
      }

      // Calculate net trade settlement
      const netTradeAmount = totalBuyAmount - totalSellAmount;
      
      // Calculate final client balance: Net Trade + Total Brokerage
      const finalClientBalance = netTradeAmount + totalBrokerage;
      const shouldGenerateBill = Math.abs(finalClientBalance) >= 0.01;

      if (!shouldGenerateBill) {
        console.log(`Skipping client bill for ${party.party_code} due to zero total (likely carry forward)`);
      } else {
        // Before creating a new bill, check if an identical bill already exists for this
        // party, date and amount (idempotency guard for repeated uploads of same file).
        const existingBillRes = await client.query(
          `SELECT id, bill_number FROM bills
           WHERE party_id = $1 AND bill_date = $2 AND bill_type = 'party'
             AND ABS(total_amount - $3) < 0.01
           ORDER BY created_at DESC
           LIMIT 1`,
          [party.id, billDateStr, finalClientBalance]
        );

        if (existingBillRes.rows.length > 0) {
          console.log(`Skipping duplicate bill for ${party.party_code} on ${billDateStr} amount=${finalClientBalance.toFixed(2)} (existing bill ${existingBillRes.rows[0].bill_number})`);
          // Do not create another bill / ledger / bill_items for this exact combination
          continue;
        }

        // Update the running balance
        // Correct accounting: 
        // - Debit (party owes you) = INCREASE balance
        // - Credit (you owe party) = DECREASE balance
        // finalClientBalance > 0 means party owes you (debit), < 0 means you owe party (credit)
        const debitAmount = finalClientBalance > 0 ? finalClientBalance : 0;
        const creditAmount = finalClientBalance < 0 ? Math.abs(finalClientBalance) : 0;
        const newClientBalance = currentClientBalance + debitAmount - creditAmount;

        // Always create new bill for each CSV upload
        // Use billDateStr (selected by user) for bill number prefix
        const [billYear, billMonth, billDay] = billDateStr.split('-');
        const suffix = String(Math.floor(Math.random() * 900) + 100);
        const billNumber = `PTY${billYear}${billMonth}${billDay}-${suffix}`;

        // Bill amount is the final amount client needs to pay (or receive if negative)
        const billResult = await client.query(
          'INSERT INTO bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [billNumber, party.id, billDateStr, finalClientBalance, 'party', 'pending']
        );

        const billId = billResult.rows[0].id;

        // Create single consolidated ledger entry
        
        const consolidatedLedgerResult = await client.query(
          'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [
            party.id,
            billDateStr,
          `Bill ${billNumber} - Buy: ₹${totalBuyAmount.toFixed(2)}, Sell: ₹${totalSellAmount.toFixed(2)}, Brokerage: ₹${totalBrokerage.toFixed(2)} (${clientTrades.length} trades)`,
            debitAmount,
            creditAmount,
            newClientBalance,
            'client_settlement',
            billId
          ]
        );
        results.ledgerEntries.push(consolidatedLedgerResult.rows[0]);
        currentClientBalance = newClientBalance;

        // For each bill item, determine its broker code (per TRADE, not per client)
        for (const item of billItems) {
          const itemBrokerCode = (item.broker_code || 'BROKER').toString().trim().toUpperCase();

          // Look up broker slabs for this broker code (if available)
          let brokerRateTrading = 0;
          let brokerRateDelivery = 0;
          const brokerQuery = await client.query(
            'SELECT trading_slab, delivery_slab FROM broker_master WHERE UPPER(broker_code) = $1',
            [itemBrokerCode]
          );
          if (brokerQuery.rows.length > 0) {
            brokerRateTrading = Number(brokerQuery.rows[0].trading_slab) || 0;
            brokerRateDelivery = Number(brokerQuery.rows[0].delivery_slab) || 0;
          }

          // Calculate broker's share for this item
          const brokerRate = item.trade_type === 'T' ? brokerRateTrading : brokerRateDelivery;
          const brokerShare = (item.amount * brokerRate) / 100;
          item.broker_share = brokerShare;

          // Add this item to that broker's group
          const key = itemBrokerCode;
          if (!brokerGroups[key]) {
            brokerGroups[key] = {
              items: [],
              // Will hold TOTAL CLIENT BROKERAGE (what client paid us) for this broker
              totalBrokerageAllClients: 0,
            };
          }
          brokerGroups[key].items.push(item);
          // Accumulate CLIENT brokerage amount for this broker (not main broker share)
          brokerGroups[key].totalBrokerageAllClients += (item.brokerage_amount || 0);
        }

        // Insert bill items with trade_type (once)
        for (const item of billItems) {
          await client.query(
            'INSERT INTO bill_items (bill_id, description, quantity, rate, amount, client_code, company_code, brokerage_rate_pct, brokerage_amount, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [
              billId,
              item.description,
              item.quantity,
              item.rate,
              item.amount,
              item.client_code,
              item.company_code,
              item.brokerage_rate_pct,
              item.brokerage_amount,
              item.trade_type,
            ]
          );
        }

        results.clientBills.push({
          billId,
          billNumber,
          clientId,
          partyName: party.name,
          totalBuyAmount,
          totalSellAmount,
          totalBrokerage,
          netAmount: finalClientBalance,
          items: billItems.length,
        });
      }

      const holdingsItems = [...billItems, ...carryForwardItems];
      for (const item of holdingsItems) {
        let company_id = null;
        if (item.company_code) {
          const companyQuery = await client.query(
            'SELECT id FROM company_master WHERE UPPER(company_code) = $1',
            [item.company_code.toUpperCase()]
          );
          if (companyQuery.rows.length > 0) {
            company_id = companyQuery.rows[0].id;
          } else {
            const newCompanyResult = await client.query(
              'INSERT INTO company_master (company_code, name, nse_code) VALUES ($1, $2, $3) RETURNING id',
              [item.company_code.toUpperCase(), item.company_code.toUpperCase(), item.company_code.toUpperCase()]
            );
            company_id = newCompanyResult.rows[0].id;
            console.log(`  ??? Auto-created company: ${item.company_code}`);
          }
        }

        if (company_id) {
          const isBuy = item.description.toUpperCase().includes('BUY');
          const qtyChange = isBuy ? item.quantity : -item.quantity;

          const holdingQuery = await client.query(
            'SELECT id, quantity, total_invested, avg_buy_price FROM stock_holdings WHERE party_id = $1 AND company_id = $2',
            [party.id, company_id]
          );

          if (holdingQuery.rows.length > 0) {
            const holding = holdingQuery.rows[0];
            const currentQty = Number(holding.quantity);
            const currentInvested = Number(holding.total_invested);
            const newQty = currentQty + qtyChange;

            if (isBuy) {
              const newInvested = currentInvested + item.amount;
              const newAvgPrice = newQty > 0 ? newInvested / newQty : holding.avg_buy_price;
              
              await client.query(
                'UPDATE stock_holdings SET quantity = $1, total_invested = $2, avg_buy_price = $3, last_trade_date = $4, last_updated = NOW() WHERE id = $5',
                [newQty, newInvested, newAvgPrice, billDateStr, holding.id]
              );
            } else {
              const newInvested = newQty > 0 ? (currentInvested / currentQty) * newQty : 0;
              
              await client.query(
                'UPDATE stock_holdings SET quantity = $1, total_invested = $2, last_trade_date = $3, last_updated = NOW() WHERE id = $4',
                [newQty, newInvested, billDateStr, holding.id]
              );
            }
          } else if (isBuy) {
            await client.query(
              'INSERT INTO stock_holdings (party_id, company_id, quantity, avg_buy_price, total_invested, last_trade_date) VALUES ($1, $2, $3, $4, $5, $6)',
              [party.id, company_id, item.quantity, item.rate, item.amount, billDateStr]
            );
          } else {
            await client.query(
              'INSERT INTO stock_holdings (party_id, company_id, quantity, avg_buy_price, total_invested, last_trade_date) VALUES ($1, $2, $3, $4, $5, $6)',
              [party.id, company_id, -item.quantity, item.rate, 0, billDateStr]
            );
          }
        }
      }

    }

    // Always create new broker bill(s) per broker for this CSV upload
    for (const [brokerIdGlobal, group] of Object.entries(brokerGroups)) {
      const allBrokerBillItems = group.items;
      // This represents TOTAL client brokerage collected by us (sub-broker side)
      // across all clients for this broker code, NOT the main broker's share.
      const totalClientBrokerageAllClients = group.totalBrokerageAllClients;

      if (allBrokerBillItems.length === 0) continue;

      const clientList = Object.keys(clientGroups).join(', ');
      
      // Calculate net trade amount from all trades for this broker
      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      for (const item of allBrokerBillItems) {
        const isBuy = item.description && item.description.toUpperCase().includes('BUY');
        if (isBuy) {
          totalBuyAmount += Number(item.amount) || 0;
        } else {
          totalSellAmount += Number(item.amount) || 0;
        }
      }
      const netTradeAmount = totalBuyAmount - totalSellAmount;
      
      // Get broker's trading slab to calculate broker's share
      const brokerQuery = await client.query(
        'SELECT trading_slab, delivery_slab FROM broker_master WHERE UPPER(broker_code) = $1',
        [brokerIdGlobal]
      );
      
      const brokerTradingSlab = brokerQuery.rows.length > 0 
        ? Number(brokerQuery.rows[0].trading_slab) 
        : 0.03; // Default 0.03% if not found
        
      const brokerDeliverySlab = brokerQuery.rows.length > 0 
        ? Number(brokerQuery.rows[0].delivery_slab) 
        : 0.03; // Default 0.03% if not found
      
      // Calculate broker's brokerage amount (main broker's cut)
      // Use weighted average based on trade types
      let brokerBrokerageAmount = 0;
      let totalTradingAmount = 0;
      let totalDeliveryAmount = 0;
      
      for (const item of allBrokerBillItems) {
        const itemAmount = Number(item.amount) || 0;
        if (item.trade_type === 'T') {
          totalTradingAmount += itemAmount;
        } else if (item.trade_type === 'D') {
          totalDeliveryAmount += itemAmount;
        }
      }
      
      brokerBrokerageAmount = (totalTradingAmount * brokerTradingSlab / 100) + 
                              (totalDeliveryAmount * brokerDeliverySlab / 100);
      
      // Main broker bill total logic:
      // - For net BUY (we buy from market via broker): broker bill = Trade + Broker's Brokerage
      // - For net SELL (we sell via broker): broker bill = Trade - Broker's Brokerage (broker keeps brokerage from proceeds)
      const grossTrade = Math.abs(netTradeAmount);
      const mainBrokerBillTotal = netTradeAmount >= 0
        ? grossTrade + brokerBrokerageAmount   // net BUY
        : grossTrade - brokerBrokerageAmount;  // net SELL
      
      // Sub-broker profit = Total CLIENT brokerage (what client paid to us)
      //                     minus Main Broker's brokerage (their share)
      const totalClientBrokerage = totalClientBrokerageAllClients;
      const subBrokerProfit = totalClientBrokerage - brokerBrokerageAmount;
      
      // Create new broker bill
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const brokerBillNumber = `BRK${y}${m}${d}-${Math.floor(Math.random() * 900) + 100}`;
      
      const brokerBillResult = await client.query(
        'INSERT INTO bills (bill_number, party_id, broker_id, broker_code, bill_date, total_amount, bill_type, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          brokerBillNumber,
          null,
          null,
          brokerIdGlobal,
          billDateStr,
          mainBrokerBillTotal,
          'broker',
          'pending',
          `Net Trade: ₹${Math.abs(netTradeAmount).toFixed(2)} + Broker Brokerage (${brokerTradingSlab}%): ₹${brokerBrokerageAmount.toFixed(2)}`
        ]
      );
      const brokerBillId = brokerBillResult.rows[0].id;
      
      // Insert all broker bill items (use party's brokerage for display)
      for (const item of allBrokerBillItems) {
        await client.query(
          'INSERT INTO bill_items (bill_id, description, quantity, rate, amount, client_code, company_code, brokerage_rate_pct, brokerage_amount, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            brokerBillId,
            item.description,
            item.quantity,
            item.rate,
            item.amount,
            item.client_code,
            item.company_code,
            item.brokerage_rate_pct, // Party's rate (sub-broker rate)
            item.brokerage_amount, // Party's brokerage (what client paid)
            item.trade_type,
          ]
        );
      }

      // Create ledger entry for Main Broker (Net Trade + Broker Brokerage)
      // Recalculate broker balance from ALL entries for accuracy
      let brokerBalance = 0;
      const allBrokerEntriesQuery = await client.query(
        `SELECT debit_amount, credit_amount 
         FROM ledger_entries 
         WHERE party_id IS NULL AND reference_type = $1 
         ORDER BY entry_date ASC, created_at ASC`,
        ['broker_brokerage']
      );
      
      // Recalculate running balance from all broker entries
      for (const entry of allBrokerEntriesQuery.rows) {
        const debit = Number(entry.debit_amount) || 0;
        const credit = Number(entry.credit_amount) || 0;
        // Broker balance: Credit increases (we owe more), Debit decreases (we owe less)
        brokerBalance = brokerBalance + credit - debit;
      }
      
      // Now add the NEW entry's amount to the balance
      let debitForBroker = 0;
      let creditForBroker = 0;
      
      if (netTradeAmount > 0) {
        // Net BUY → broker has to receive money from us → credit
        creditForBroker = mainBrokerBillTotal;
        brokerBalance = brokerBalance + mainBrokerBillTotal;  // We owe more to broker
      } else {
        // Net SELL or flat → broker payable reduces / we owe less → debit
        debitForBroker = mainBrokerBillTotal;
        brokerBalance = brokerBalance - mainBrokerBillTotal;  // We owe less to broker
      }
 
      const brokerLedgerResult = await client.query(
        'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Main Broker Bill ${brokerBillNumber} - Net Trade: ₹${Math.abs(netTradeAmount).toFixed(2)} + Brokerage: ₹${brokerBrokerageAmount.toFixed(2)}`,
          debitForBroker,
          creditForBroker,
          brokerBalance,
          'broker_brokerage',
          brokerBillId
        ]
      );
      results.brokerEntries.push(brokerLedgerResult.rows[0]);
      
      // Create Sub-Broker Profit ledger entry
      // Recalculate sub-broker profit balance from ALL entries for accuracy
      let subBrokerProfitBalance = 0;
      const allProfitEntriesQuery = await client.query(
        `SELECT debit_amount, credit_amount 
         FROM ledger_entries 
         WHERE party_id IS NULL AND reference_type = $1 
         ORDER BY entry_date ASC, created_at ASC`,
        ['sub_broker_profit']
      );
      
      // Recalculate running balance from all profit entries
      for (const entry of allProfitEntriesQuery.rows) {
        const debit = Number(entry.debit_amount) || 0;
        const credit = Number(entry.credit_amount) || 0;
        // Sub-broker profit: Credit increases profit (always positive for profit)
        subBrokerProfitBalance = subBrokerProfitBalance + credit - debit;
      }
      
      // Add the NEW profit entry
      subBrokerProfitBalance = subBrokerProfitBalance + subBrokerProfit;
      
      const profitLedgerResult = await client.query(
        'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Sub-Broker Profit - Bill ${brokerBillNumber} - Sub-broker: ₹${totalClientBrokerage.toFixed(2)}, Main Broker: ₹${brokerBrokerageAmount.toFixed(2)}, Profit: ₹${subBrokerProfit.toFixed(2)}`,
          0,
          subBrokerProfit,
          subBrokerProfitBalance,
          'sub_broker_profit',
          brokerBillId
        ]
      );
      results.brokerEntries.push(profitLedgerResult.rows[0]);
      
      // Optionally expose last broker bill summary (kept for backwards compatibility)
      results.brokerBill = {
        billId: brokerBillId,
        billNumber: brokerBillNumber,
        brokerId: brokerIdGlobal,
        mainBrokerBillTotal: mainBrokerBillTotal,
        netTradeAmount: Math.abs(netTradeAmount),
        brokerBrokerageAmount: brokerBrokerageAmount,
        subBrokerBrokerage: totalClientBrokerage,
        subBrokerProfit: subBrokerProfit,
        clients: Object.keys(clientGroups).length,
        items: allBrokerBillItems.length,
      };
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Stock trades processed successfully',
      ...results,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing stock trades:', error);
    res.status(500).json({ error: 'Failed to process stock trades', details: error.message });
  } finally {
    client.release();
  }
});

// Get broker ledger (all broker brokerage entries)
app.get('/api/ledger/broker', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC',
      ['broker_brokerage']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching broker ledger:', error);
    res.status(500).json({ error: 'Failed to fetch broker ledger' });
  }
});

// Get sub-broker profit (total earnings)
app.get('/api/ledger/sub-broker-profit', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(credit_amount), 0) as total_profit,
        COALESCE(MAX(balance), 0) as current_balance,
        COUNT(*) as transaction_count
       FROM ledger_entries 
       WHERE party_id IS NULL AND reference_type = $1`,
      ['sub_broker_profit']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sub-broker profit:', error);
    res.status(500).json({ error: 'Failed to fetch sub-broker profit' });
  }
});

// =========================
// PARTY LEDGER SUMMARY (Equity & FO)
// =========================

// Summarize ledger by party: total debit, credit, closing balance
// module: 'equity' (default) uses ledger_entries
//         'fo' uses fo_ledger_entries
app.get('/api/summary/parties', async (req, res) => {
  try {
    const module = (req.query.module || 'equity').toString().toLowerCase();
    const isFO = module === 'fo';

    const table = isFO ? 'fo_ledger_entries' : 'ledger_entries';

    // For F&O module, get the latest balance for each party instead of summing all entries
    // This ensures we show current balances like the equity module does
    let sql;
    if (isFO) {
      // For F&O, show a "balanced" summary:
      // - MAIN-BROKER shows under Debit (amount payable to main broker)
      // - Parties + SUB-BROKER show under Credit (amount receivable + profit)
      // And we emit signed closing balances so Net Closing becomes 0 when books balance.
      sql = `
        WITH latest_balances AS (
          SELECT DISTINCT ON (
            CASE 
              WHEN party_id IS NULL AND reference_type IN ('broker_brokerage','broker_payment') THEN 'MAIN-BROKER'
              WHEN party_id IS NULL AND reference_type = 'sub_broker_profit' THEN 'SUB-BROKER'
              ELSE party_id::text
            END
          )
            party_id,
            reference_type,
            balance,
            entry_date,
            created_at,
            CASE 
              WHEN party_id IS NULL AND reference_type IN ('broker_brokerage','broker_payment') THEN 'MAIN-BROKER'
              WHEN party_id IS NULL AND reference_type = 'sub_broker_profit' THEN 'SUB-BROKER'
              ELSE party_id::text
            END AS group_key
          FROM ${table}
          WHERE (party_id IS NOT NULL)
             OR (party_id IS NULL AND reference_type IN ('broker_brokerage','broker_payment','sub_broker_profit'))
          ORDER BY 
            CASE 
              WHEN party_id IS NULL AND reference_type IN ('broker_brokerage','broker_payment') THEN 'MAIN-BROKER'
              WHEN party_id IS NULL AND reference_type = 'sub_broker_profit' THEN 'SUB-BROKER'
              ELSE party_id::text
            END,
            entry_date DESC,
            created_at DESC
        )
        SELECT
          CASE 
            WHEN lb.group_key = 'MAIN-BROKER' THEN 'MAIN-BROKER'
            WHEN lb.group_key = 'SUB-BROKER' THEN 'SUB-BROKER'
            ELSE p.party_code
          END AS party_code,
          CASE 
            WHEN lb.group_key = 'MAIN-BROKER' THEN 'Main Broker'
            WHEN lb.group_key = 'SUB-BROKER' THEN 'Sub Broker Profit'
            ELSE p.name
          END AS party_name,
          CASE 
            WHEN lb.group_key = 'MAIN-BROKER' THEN ABS(COALESCE(lb.balance, 0))
            ELSE 0
          END AS total_debit,
          CASE 
            WHEN lb.group_key <> 'MAIN-BROKER' THEN ABS(COALESCE(lb.balance, 0))
            ELSE 0
          END AS total_credit,
          CASE 
            WHEN lb.group_key = 'MAIN-BROKER' THEN ABS(COALESCE(lb.balance, 0))
            ELSE -ABS(COALESCE(lb.balance, 0))
          END AS closing_balance
        FROM latest_balances lb
        LEFT JOIN party_master p ON lb.party_id = p.id
        WHERE lb.balance IS NOT NULL
        ORDER BY party_code
      `;
    } else {
      // Original equity logic
      sql = `
        SELECT
          COALESCE(
            p.party_code,
            CASE 
              WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN 'MAIN-BROKER'
              WHEN l.party_id IS NULL AND l.reference_type = 'sub_broker_profit' THEN 'SUB-BROKER'
              ELSE NULL
            END
          ) AS party_code,
          COALESCE(
            p.name,
            CASE 
              WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN 'Main Broker'
              WHEN l.party_id IS NULL AND l.reference_type = 'sub_broker_profit' THEN 'Sub Broker Profit'
              ELSE NULL
            END
          ) AS party_name,
          COALESCE(SUM(l.debit_amount), 0)  AS total_debit,
          COALESCE(SUM(l.credit_amount), 0) AS total_credit,
          -- Closing = Debit - Credit so that client receivable (they owe us) shows as positive,
          -- and payable (we owe them / main broker) shows as negative.
          COALESCE(SUM(l.debit_amount - l.credit_amount), 0) AS closing_balance
        FROM ${table} l
        LEFT JOIN party_master p ON l.party_id = p.id
        WHERE (l.party_id IS NOT NULL)
           OR (l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment','sub_broker_profit'))
        GROUP BY 
          COALESCE(
            p.party_code,
            CASE 
              WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN 'MAIN-BROKER'
              WHEN l.party_id IS NULL AND l.reference_type = 'sub_broker_profit' THEN 'SUB-BROKER'
              ELSE NULL
            END
          ),
          COALESCE(
            p.name,
            CASE 
              WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN 'Main Broker'
              WHEN l.party_id IS NULL AND l.reference_type = 'sub_broker_profit' THEN 'Sub Broker Profit'
              ELSE NULL
            END
          )
        ORDER BY party_code
      `;
    }

    const result = await pool.query(sql);
    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching party ledger summary:', error);
    return res.status(500).json({ error: 'Failed to fetch party ledger summary', details: error.message });
  }
});

// Get Equity dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(DISTINCT party_id) FROM bills WHERE bill_type = 'party' AND party_id IS NOT NULL) as active_clients,
        (SELECT COALESCE(SUM(ABS(total_amount)), 0) FROM bills WHERE bill_type = 'party') as total_billed,
        (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM bills WHERE bill_type = 'party' AND status != 'paid' AND (total_amount - paid_amount) > 0) as pending_receivables,
        (SELECT COUNT(*) FROM bills WHERE bill_type = 'party' AND status = 'pending') as pending_bills_count,
        (SELECT COALESCE(SUM(credit_amount), 0) 
         FROM ledger_entries 
         WHERE party_id IS NULL 
         AND reference_type = 'sub_broker_profit' 
         AND entry_date = CURRENT_DATE) as today_brokerage
    `);
    res.json(stats.rows[0] || {});
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent bills for dashboard
app.get('/api/dashboard/recent-bills', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id,
        b.bill_number,
        b.bill_date,
        b.total_amount,
        b.paid_amount,
        (b.total_amount - b.paid_amount) as pending_amount,
        b.status,
        p.party_code,
        p.name as party_name
      FROM bills b
      LEFT JOIN party_master p ON b.party_id = p.id
      WHERE b.bill_type = 'party'
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching recent bills:', error);
    res.status(500).json({ error: 'Failed to fetch recent bills' });
  }
});

// Stock Holdings API endpoints
app.get('/api/holdings', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    // Base query for holdings
    let baseQuery = `
      WITH raw AS (
        -- Derive per-broker net quantity and last trade date per (party, company, broker)
        SELECT 
          pm.id AS party_id,
          bi.company_code,
          b.broker_code,
          MAX(b.bill_date) AS last_trade_date,
          SUM(
            CASE 
              WHEN UPPER(bi.description) LIKE '%BUY%' THEN COALESCE(bi.quantity,0)
              WHEN UPPER(bi.description) LIKE '%SELL%' THEN -COALESCE(bi.quantity,0)
              ELSE 0
            END
          ) AS broker_net_qty
        FROM bill_items bi
        INNER JOIN bills b ON bi.bill_id = b.id
        INNER JOIN party_master pm ON UPPER(pm.party_code) = UPPER(bi.client_code)
        WHERE b.bill_type = 'broker' AND b.broker_code IS NOT NULL
    `;
    
    // Add date filters if provided
    if (from_date || to_date) {
      if (from_date) {
        baseQuery += ` AND b.bill_date >= '${from_date}'`;
      }
      if (to_date) {
        baseQuery += ` AND b.bill_date <= '${to_date}'`;
      }
    }
    
    baseQuery += `
        GROUP BY pm.id, bi.company_code, b.broker_code
      ),
      tx AS (
        SELECT 
          party_id,
          company_code,
          MAX(last_trade_date) AS last_trade_date,
          STRING_AGG(DISTINCT broker_code, ', ') AS broker_codes,
          STRING_AGG(broker_code || ':' || broker_net_qty::text, ', ') AS broker_qty_breakdown
        FROM raw
        GROUP BY party_id, company_code
      )
      SELECT 
        h.*,
        p.party_code,
        p.name as party_name,
        c.company_code,
        c.name as company_name,
        c.nse_code,
        COALESCE(tx.last_trade_date, h.last_trade_date) AS last_trade_date,
        tx.broker_codes,
        tx.broker_qty_breakdown
      FROM stock_holdings h
      LEFT JOIN party_master p ON h.party_id = p.id
      LEFT JOIN company_master c ON h.company_id = c.id
      LEFT JOIN tx ON tx.party_id = h.party_id AND tx.company_code = c.company_code
      ORDER BY h.quantity DESC, p.name, c.name
    `;
    
    const result = await pool.query(baseQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching holdings:', error);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

app.get('/api/holdings/party/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;
    const { from_date, to_date } = req.query;
    
    // Base query for holdings
    let baseQuery = `
      WITH raw AS (
        -- Derive per-broker net quantity and last trade date per (party, company, broker)
        SELECT 
          pm.id AS party_id,
          bi.company_code,
          b.broker_code,
          MAX(b.bill_date) AS last_trade_date,
          SUM(
            CASE 
              WHEN UPPER(bi.description) LIKE '%BUY%' THEN COALESCE(bi.quantity,0)
              WHEN UPPER(bi.description) LIKE '%SELL%' THEN -COALESCE(bi.quantity,0)
              ELSE 0
            END
          ) AS broker_net_qty
        FROM bill_items bi
        INNER JOIN bills b ON bi.bill_id = b.id
        INNER JOIN party_master pm ON UPPER(pm.party_code) = UPPER(bi.client_code)
        WHERE b.bill_type = 'broker' AND b.broker_code IS NOT NULL
    `;
    
    // Add party filter
    baseQuery += ` AND pm.id = '${partyId}'`;
    
    // Add date filters if provided
    if (from_date || to_date) {
      if (from_date) {
        baseQuery += ` AND b.bill_date >= '${from_date}'`;
      }
      if (to_date) {
        baseQuery += ` AND b.bill_date <= '${to_date}'`;
      }
    }
    
    baseQuery += `
        GROUP BY pm.id, bi.company_code, b.broker_code
      ),
      tx AS (
        SELECT 
          party_id,
          company_code,
          MAX(last_trade_date) AS last_trade_date,
          STRING_AGG(DISTINCT broker_code, ', ') AS broker_codes,
          STRING_AGG(broker_code || ':' || broker_net_qty::text, ', ') AS broker_qty_breakdown
        FROM raw
        GROUP BY party_id, company_code
      )
      SELECT 
        h.*,
        c.company_code,
        c.name as company_name,
        c.nse_code,
        COALESCE(tx.last_trade_date, h.last_trade_date) AS last_trade_date,
        tx.broker_codes,
        tx.broker_qty_breakdown
      FROM stock_holdings h
      LEFT JOIN company_master c ON h.company_id = c.id
      LEFT JOIN tx ON tx.party_id = h.party_id AND tx.company_code = c.company_code
      WHERE h.party_id = $1
      ORDER BY h.quantity DESC, c.name
    `;
    
    const result = await pool.query(baseQuery, [partyId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching party holdings:', error);
    res.status(500).json({ error: 'Failed to fetch party holdings' });
  }
});

// Get transaction history for holdings (date-wise buy/sell movements)
app.get('/api/holdings/transactions', async (req, res) => {
  try {
    const { party_id, company_code, from_date, to_date } = req.query;
    
    let query = `
      SELECT 
        bi.id,
        bi.bill_id,
        b.bill_number,
        b.bill_date,
        b.party_id,
        p.party_code,
        p.name as party_name,
        bi.company_code,
        bi.description,
        bi.quantity,
        bi.rate,
        bi.amount,
        bi.brokerage_amount,
        bi.trade_type,
        bi.created_at
      FROM bill_items bi
      INNER JOIN bills b ON bi.bill_id = b.id
      LEFT JOIN party_master p ON b.party_id = p.id
      WHERE b.bill_type = 'party'
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (party_id) {
      query += ` AND b.party_id = $${paramIndex}`;
      params.push(party_id);
      paramIndex++;
    }
    
    if (company_code) {
      query += ` AND bi.company_code = $${paramIndex}`;
      params.push(company_code);
      paramIndex++;
    }
    
    if (from_date) {
      query += ` AND b.bill_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    
    if (to_date) {
      query += ` AND b.bill_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    query += ' ORDER BY b.bill_date ASC, bi.created_at ASC';
    
    const result = await pool.query(query, params);
    
    // Calculate running balance per company per party
    const transactions = [];
    const balances = {}; // Key: "party_id:company_code"
    
    for (const row of result.rows) {
      const key = `${row.party_id}:${row.company_code}`;
      if (!balances[key]) {
        balances[key] = 0;
      }
      
      // Determine if BUY or SELL from description
      const isBuy = row.description && row.description.toUpperCase().includes('BUY');
      const isSell = row.description && row.description.toUpperCase().includes('SELL');
      
      const quantity = Number(row.quantity) || 0;
      
      if (isBuy) {
        balances[key] += quantity;
      } else if (isSell) {
        balances[key] -= quantity;
      }
      
      transactions.push({
        id: row.id,
        bill_id: row.bill_id,
        bill_number: row.bill_number,
        bill_date: row.bill_date,
        party_id: row.party_id,
        party_code: row.party_code,
        party_name: row.party_name,
        company_code: row.company_code,
        description: row.description,
        type: isBuy ? 'BUY' : isSell ? 'SELL' : 'UNKNOWN',
        quantity: quantity,
        rate: Number(row.rate) || 0,
        amount: Number(row.amount) || 0,
        brokerage_amount: Number(row.brokerage_amount) || 0,
        trade_type: row.trade_type,
        balance: balances[key],
        created_at: row.created_at
      });
    }
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Get broker holdings summary (aggregated by broker across all clients)
app.get('/api/holdings/broker', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    // Base query for broker holdings
    let baseQuery = `
      WITH broker_raw AS (
        -- Derive per-broker net quantity and last trade date per (broker, company)
        SELECT 
          b.broker_code,
          bi.company_code,
          MAX(b.bill_date) AS last_trade_date,
          SUM(
            CASE 
              WHEN UPPER(bi.description) LIKE '%BUY%' THEN COALESCE(bi.quantity,0)
              WHEN UPPER(bi.description) LIKE '%SELL%' THEN -COALESCE(bi.quantity,0)
              ELSE 0
            END
          ) AS broker_net_qty,
          COUNT(DISTINCT pm.id) AS client_count
        FROM bill_items bi
        INNER JOIN bills b ON bi.bill_id = b.id
        INNER JOIN party_master pm ON UPPER(pm.party_code) = UPPER(bi.client_code)
        WHERE b.bill_type = 'broker' AND b.broker_code IS NOT NULL
    `;
    
    // Add date filters if provided
    if (from_date || to_date) {
      if (from_date) {
        baseQuery += ` AND b.bill_date >= '${from_date}'`;
      }
      if (to_date) {
        baseQuery += ` AND b.bill_date <= '${to_date}'`;
      }
    }
    
    baseQuery += `
        GROUP BY b.broker_code, bi.company_code
      ),
      broker_summary AS (
        SELECT 
          broker_code,
          company_code,
          MAX(last_trade_date) AS last_trade_date,
          SUM(broker_net_qty) AS total_quantity,
          COUNT(DISTINCT client_count) AS client_count
        FROM broker_raw
        GROUP BY broker_code, company_code
      ),
      company_details AS (
        SELECT 
          c.company_code,
          c.name as company_name,
          c.nse_code
        FROM company_master c
      ),
      broker_details AS (
        SELECT 
          bm.broker_code,
          bm.name as broker_name
        FROM broker_master bm
      )
      SELECT 
        bs.broker_code,
        bd.broker_name,
        bs.company_code,
        cd.company_name,
        cd.nse_code,
        bs.total_quantity,
        COALESCE(AVG(bi.rate), 0) AS avg_price,
        COALESCE(SUM(bi.amount), 0) AS total_invested,
        bs.client_count,
        bs.last_trade_date
      FROM broker_summary bs
      LEFT JOIN company_details cd ON bs.company_code = cd.company_code
      LEFT JOIN broker_details bd ON bs.broker_code = bd.broker_code
      LEFT JOIN bills b ON b.broker_code = bs.broker_code AND b.bill_type = 'broker'
      LEFT JOIN bill_items bi ON bi.bill_id = b.id AND bi.company_code = bs.company_code
      GROUP BY 
        bs.broker_code, 
        bd.broker_name, 
        bs.company_code, 
        cd.company_name, 
        cd.nse_code, 
        bs.total_quantity, 
        bs.client_count, 
        bs.last_trade_date
      ORDER BY bs.total_quantity DESC, bs.broker_code, bs.company_code
    `;
    
    const result = await pool.query(baseQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching broker holdings:', error);
    res.status(500).json({ error: 'Failed to fetch broker holdings' });
  }
});

// Record broker payment (for equity broker bills)
// NOTE: this is a thin helper around the generic /api/payments logic,
//       so that UI code that only knows billId can still record a payment.
app.post('/api/bills/:billId/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { billId } = req.params;
    const { amount, payment_date, payment_method, reference_number, notes } = req.body;

    // Basic validation
    const amountValue = Number(amount);
    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    await client.query('BEGIN');

    // Get bill details
    const billResult = await client.query('SELECT * FROM bills WHERE id = $1', [billId]);
    if (billResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Bill not found' });
    }
    const bill = billResult.rows[0];

    const isBrokerBill = bill.bill_type === 'broker';
    // For broker bills, party_id will typically be NULL; that's OK.
    const partyId = bill.party_id || null;

    // Generate payment number
    const now = new Date();
    const paymentNumber = `PAY${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    // Insert payment record (legacy payments table does not have reference_number column)
    const paymentInsert = await client.query(
      'INSERT INTO payments (payment_number, party_id, bill_id, payment_date, amount, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [paymentNumber, partyId, billId, payment_date, amountValue, payment_method || 'cash', notes || null]
    );

    // Update bill paid amount and status (treat NULL as 0)
    const currentPaid = Number(bill.paid_amount || 0);
    const billTotal = Number(bill.total_amount || 0);
    const newPaidAmount = currentPaid + amountValue;
    const isFullyPaid = newPaidAmount >= billTotal - 0.01;
    const newStatus = isFullyPaid ? 'paid' : 'partially_paid';

    await client.query(
      'UPDATE bills SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [newPaidAmount, newStatus, billId]
    );

    // For equity party bills, also create a client ledger entry so balance moves with payments.
    if (partyId && !isBrokerBill) {
      // Get last balance
      const balRes = await client.query(
        `SELECT balance FROM ledger_entries
         WHERE party_id = $1
         ORDER BY entry_date DESC, created_at DESC
         LIMIT 1`,
        [partyId]
      );
      const currentBalance = balRes.rows.length > 0 ? Number(balRes.rows[0].balance) || 0 : 0;

      // Convention: positive balance = client owes you.
      // A payment from client (for a bill) is a Pay-In ? reduces balance.
      // If current balance is negative (you owe broker), a payment should make it less negative (closer to zero)
            const newBalance = currentBalance >= 0 
              ? currentBalance - amountValue 
              : currentBalance + amountValue;

      await client.query(
        `INSERT INTO ledger_entries
           (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          partyId,
          payment_date || now.toISOString().slice(0, 10),
          `Pay-In (bill ${bill.bill_number || billId})`,
          0,
          amountValue,
          newBalance,
          'payment_received',
          paymentInsert.rows[0].id,
        ]
      );
    }

    // For broker bills, update main broker ledger (party_id NULL, broker_brokerage account)
    if (isBrokerBill) {
      // Get last broker_brokerage balance
      const balRes = await client.query(
        `SELECT balance FROM ledger_entries
         WHERE party_id IS NULL AND reference_type = $1
         ORDER BY entry_date DESC, created_at DESC
         LIMIT 1`,
        ['broker_brokerage']
      );
      const currentBalance = balRes.rows.length > 0 ? Number(balRes.rows[0].balance) || 0 : 0;

      // Convention: positive balance = you owe main broker (credit from bills).
      // A payment FROM main broker (to you) reduces that balance.
      // If current balance is negative (you owe broker), a payment should make it less negative (closer to zero)
            const newBalance = currentBalance >= 0 
              ? currentBalance - amountValue 
              : currentBalance + amountValue;

      await client.query(
        `INSERT INTO ledger_entries
           (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          null,
          payment_date || now.toISOString().slice(0, 10),
          `Main Broker Payment (bill ${bill.bill_number || billId})`,
          0,  // debit_amount (changed from amountValue)
          amountValue,  // credit_amount (changed from 0)
          newBalance,
          'broker_payment',
          paymentInsert.rows[0].id,
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentNumber,
      newPaidAmount,
      newStatus,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment', details: error.message });
  } finally {
    client.release();
  }
});

// Add payment processing endpoint
app.post('/api/payments', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      payment_id, 
      party_id, 
      amount, 
      date, 
      apply_to_bill_id, 
      payment_method,
      payment_type, // 'payin' or 'payout'
      notes
    } = req.body;
    
    // Validate required fields
    if (!payment_id || !party_id || !amount || !date) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['payment_id', 'party_id', 'amount', 'date'] 
      });
    }
    
    // Validate payment_type
    const payType = (payment_type || 'payin').toLowerCase();
    if (payType !== 'payin' && payType !== 'payout') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid payment_type. Must be "payin" or "payout"' 
      });
    }
    
    // Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Check idempotency - if payment already exists, return existing result
    const existingPayment = await client.query(
      'SELECT * FROM payments WHERE id = $1',
      [payment_id]
    );
    
    if (existingPayment.rows.length > 0) {
      // Return existing payment result
      const payment = existingPayment.rows[0];
      
      // Get ledger entries for this payment
      const ledgerEntries = await client.query(
        `SELECT * FROM ledger_entries 
         WHERE reference_type = 'payment_received' AND reference_id = $1 
         ORDER BY created_at`,
        [payment_id]
      );
      
      // Get party's current ledger balance
      const partyLedgerResult = await client.query(
        `SELECT balance FROM ledger_entries 
         WHERE party_id = $1
         ORDER BY entry_date DESC, created_at DESC LIMIT 1`,
        [actualPartyId]
      );
      
      const newBalance = partyLedgerResult.rows.length > 0 ? 
        parseFloat(partyLedgerResult.rows[0].balance) : 0;
      
      await client.query('COMMIT');
      
      return res.json({
        success: true,
        payment_id: payment.id,
        applied_to: payment.bill_id,
        new_balance: newBalance,
        ledger_entries: ledgerEntries.rows
      });
    }
    
    // Validate party exists
    // Handle special case for main broker payments
    let actualPartyId = party_id;
    let party;
    
    if (party_id === 'main-broker') {
      // Look up the actual main broker party ID
      const mainBrokerResult = await client.query(
        `SELECT id, party_code FROM party_master WHERE party_code = 'MAIN-BROKER' LIMIT 1`
      );
      
      if (mainBrokerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Main broker party not found' });
      }
      
      party = mainBrokerResult.rows[0];
      actualPartyId = party.id;
    } else {
      const partyResult = await client.query(
        'SELECT id, party_code FROM party_master WHERE id = $1',
        [party_id]
      );
      
      if (partyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Party not found' });
      }
      
      party = partyResult.rows[0];
    }
    
    // Validate bill if provided
    let bill = null;
    if (apply_to_bill_id) {
      const billResult = await client.query(
        'SELECT id, total_amount, paid_amount, status FROM bills WHERE id = $1 AND party_id = $2',
        [apply_to_bill_id, actualPartyId]
      );
      
      if (billResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bill not found or does not belong to this party' });
      }
      
      bill = billResult.rows[0];
      
      // Check if bill is already paid
      if (bill.status === 'paid') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bill is already paid' });
      }
    }
    
    // Use provided payment method, fallback to cash
    const paymentMethod = (payment_method && payment_method.trim()) || 'cash';
    
    // Get party's current ledger balance
    const partyLedgerResult = await client.query(
      `SELECT balance FROM ledger_entries 
       WHERE party_id = $1
       ORDER BY entry_date DESC, created_at DESC LIMIT 1`,
      [actualPartyId]
    );
    
    const currentPartyBalance = partyLedgerResult.rows.length > 0 ? 
      parseFloat(partyLedgerResult.rows[0].balance) : 0;
    
    // Calculate new balance based on payment type
    // Convention: positive balance = client owes you, negative = you owe client.
    // Pay-In: Party pays you (credit) → your receivable decreases → balance goes DOWN.
    // Pay-Out: You pay party (debit) → your receivable decreases OR your payable increases →
    //          from your point of view we still want the running balance to go DOWN when money leaves.
    let debitAmount = 0;
    let creditAmount = 0;
    let newPartyBalance;
    let particulars;
    let referenceType;
    
    // Also create corresponding broker ledger entry
    let brokerDebitAmount = 0;
    let brokerCreditAmount = 0;
    let brokerNewBalance = 0;
    let brokerParticulars = '';
    
    if (payType === 'payin') {
      // Party pays you (Money IN from party = you TAKE from party)
      // PARTY DEBIT: Party owes less, you receive money
      // In ledger: Debit increases receivables
      debitAmount = amountValue;
      creditAmount = 0;
      newPartyBalance = currentPartyBalance - amountValue;  // Balance decreases (they owe less)
      particulars = apply_to_bill_id 
        ? `Pay-In (${paymentMethod}) applied to bill ${bill?.bill_number || apply_to_bill_id}` 
        : `Pay-In received (${paymentMethod})`;
      referenceType = 'payment_received';
      
      // For broker: When party pays you, broker CREDIT (you take from broker)
      brokerDebitAmount = 0;
      brokerCreditAmount = amountValue;
      brokerParticulars = `Broker adjustment for client pay-in: ${party.party_code} paid ${amountValue}`;
    } else {
      // You pay party (Money OUT to party = you GIVE to party)
      // PARTY CREDIT: Party is owed more, you pay money
      // In ledger: Credit decreases receivables / increases payables
      debitAmount = 0;
      creditAmount = amountValue;
      newPartyBalance = currentPartyBalance - amountValue;  // Balance decreases (you owe less)
      particulars = apply_to_bill_id 
        ? `Pay-Out (${paymentMethod}) for bill ${bill?.bill_number || apply_to_bill_id}` 
        : `Pay-Out made (${paymentMethod})`;
      referenceType = 'payment_made';
      
      // For broker: When you pay party, broker DEBIT (you give to broker)
      brokerDebitAmount = amountValue;
      brokerCreditAmount = 0;
      brokerParticulars = `Broker adjustment for client pay-out: ${party.party_code} received ${amountValue}`;
    }
    
    // Create party ledger entry
    const partyLedgerEntry = await client.query(
      `INSERT INTO ledger_entries 
        (party_id, entry_date, particulars, debit_amount, credit_amount, balance, 
         reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        actualPartyId, 
        date, 
        particulars,
        debitAmount,
        creditAmount,
        newPartyBalance,
        referenceType,
        payment_id
      ]
    );
    
    // Create corresponding broker ledger entry
    // Get main broker party ID (you may need to adjust this based on your setup)
    const brokerResult = await client.query(
      `SELECT id FROM party_master WHERE party_code = 'MAIN-BROKER' LIMIT 1`
    );
    
    let brokerLedgerEntry = null;
    if (brokerResult.rows.length > 0) {
      const brokerPartyId = brokerResult.rows[0].id;
      
      // Get broker's current balance
      const brokerLedgerResult = await client.query(
        `SELECT balance FROM ledger_entries 
         WHERE party_id = $1
         ORDER BY entry_date DESC, created_at DESC LIMIT 1`,
        [brokerPartyId]
      );
      
      const currentBrokerBalance = brokerLedgerResult.rows.length > 0 ? 
        parseFloat(brokerLedgerResult.rows[0].balance) : 0;
      
      brokerNewBalance = currentBrokerBalance + brokerCreditAmount - brokerDebitAmount;
      
      brokerLedgerEntry = await client.query(
        `INSERT INTO ledger_entries 
          (party_id, entry_date, particulars, debit_amount, credit_amount, balance, 
           reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          brokerPartyId, 
          date, 
          brokerParticulars,
          brokerDebitAmount,
          brokerCreditAmount,
          brokerNewBalance,
          referenceType,
          payment_id
        ]
      );
    }
    
    // Update bill if applicable
    let updatedBill = null;
    if (bill) {
      const newPaidAmount = parseFloat(bill.paid_amount) + amountValue;
      const isFullyPaid = newPaidAmount >= parseFloat(bill.total_amount);
      
      const billUpdateResult = await client.query(
        `UPDATE bills 
         SET paid_amount = $1, status = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [
          newPaidAmount,
          isFullyPaid ? 'paid' : 'partially_paid',
          apply_to_bill_id
        ]
      );
      
      updatedBill = billUpdateResult.rows[0];
    }
    
    // Create payment record
    const paymentNumber = `PAY-${Date.now()}`;
    const paymentResult = await client.query(
      `INSERT INTO payments 
        (id, payment_number, party_id, bill_id, payment_date, amount, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        payment_id,
        paymentNumber,
        actualPartyId,
        apply_to_bill_id,
        date,
        amountValue,
        paymentMethod,
        notes || null
      ]
    );
    
    await client.query('COMMIT');
    
    // Return success response
    const responseEntries = [partyLedgerEntry.rows[0]];
    if (brokerLedgerEntry) {
      responseEntries.push(brokerLedgerEntry.rows[0]);
    }
    
    res.json({
      success: true,
      payment_id: paymentResult.rows[0].id,
      applied_to: apply_to_bill_id,
      new_balance: newPartyBalance,
      ledger_entries: responseEntries
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// =========================
// CASH MODULE HELPERS
// =========================

// Resolve party_id from party_code for cash ledger entries
async function getPartyIdByCode(partyCode) {
  if (!partyCode) return null;
  const code = String(partyCode).toUpperCase();
  const q = await pool.query(
    'SELECT id FROM party_master WHERE UPPER(party_code) = $1 LIMIT 1',
    [code]
  );
  return q.rows?.[0]?.id || null;
}

// Get latest balance for party from cash ledger entries
async function getLatestCashBalanceForParty(partyId) {
  if (!partyId) return 0;
  const q = await pool.query(
    `SELECT balance FROM ledger_entries
     WHERE party_id = $1 AND reference_type = 'cash'
     ORDER BY entry_date DESC, created_at DESC
     LIMIT 1`,
    [partyId]
  );
  if (!q.rows.length) return 0;
  return Number(q.rows[0].balance) || 0;
}

// Insert a cash ledger entry (RECEIPT or PAYMENT) and return it
async function insertCashLedgerEntry(client, {
  partyId,
  date,
  type,      // 'RECEIPT' | 'PAYMENT'
  amount,
  narration,
  cashId,
}) {
  const prevBalance = await getLatestCashBalanceForParty(partyId);

  let debit = 0;
  let credit = 0;
  let newBalance = prevBalance;

  if (type === 'RECEIPT') {
    credit = amount;
    newBalance = prevBalance + amount;
  } else if (type === 'PAYMENT') {
    debit = amount;
    newBalance = prevBalance - amount;
  } else {
    throw new Error(`Invalid cash type: ${type}`);
  }

  const particulars = `CASH ${type} - ${narration || ''}`.trim();

  const ledgerRes = await client.query(
    `INSERT INTO ledger_entries
       (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      partyId,
      date,
      particulars,
      debit,
      credit,
      newBalance,
      'cash',
      cashId,
    ]
  );

  return ledgerRes.rows[0];
}

// Record F&O payment
app.post('/api/fo/payments', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      party_id,
      amount,
      date,
      apply_to_bill_id,
      payment_method,
      payment_type, // 'payin' or 'payout'
      notes
    } = req.body;
    
    if (!party_id || !amount || !date) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['party_id', 'amount', 'date']
      });
    }
    
    // Validate payment_type
    const payType = (payment_type || 'payin').toLowerCase();
    if (payType !== 'payin' && payType !== 'payout') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid payment_type. Must be "payin" or "payout"' 
      });
    }
    
    // Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Get party details
    const partyResult = await client.query(
      'SELECT * FROM party_master WHERE id = $1',
      [party_id]
    );
    
    if (partyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Party not found' });
    }
    
    const party = partyResult.rows[0];
    
    let bill = null;
    let foBillId = null;
    
    // If applying to a bill, validate it
    if (apply_to_bill_id) {
      foBillId = parseInt(apply_to_bill_id);
      const billResult = await client.query(
        'SELECT * FROM fo_bills WHERE id = $1 AND party_id = $2',
        [foBillId, party_id]
      );
      if (billResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bill not found or does not belong to this party' });
      }
      bill = billResult.rows[0];
      if (bill.status === 'paid') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Bill is already paid' });
      }
    }
    
    const paymentMethod = (payment_method && payment_method.trim()) || 'cash';
    
    const ledgerResult = await client.query(
      `SELECT balance FROM fo_ledger_entries 
       WHERE party_id = $1
       ORDER BY entry_date DESC, created_at DESC LIMIT 1`,
      [party_id]
    );
    const currentBalance = ledgerResult.rows.length > 0
      ? parseFloat(ledgerResult.rows[0].balance)
      : 0;
    
    // FO ledger convention (same as Equity):
    //   Positive balance  = client owes you (UI may show as '-')
    //   Negative balance  = you owe client
    // Our goal for both Pay-In and Pay-Out is that paying the exact F&O bill
    // amount should bring the running balance back to 0 (no one owes anything).
    
    // Calculate new balance based on payment type
    let debitAmount = 0;
    let creditAmount = 0;
    let newBalance;
    let particulars;
    let referenceType;
    
    // Also create corresponding broker ledger entry
    let brokerDebitAmount = 0;
    let brokerCreditAmount = 0;
    let brokerNewBalance = 0;
    let brokerParticulars = '';
    
    if (payType === 'payin') {
      // Party pays you (Money IN from party = you TAKE from party)
      // PARTY DEBIT: Party owes less, you receive money
      debitAmount = amountValue;
      creditAmount = 0;
      newBalance = currentBalance - amountValue;  // Balance decreases (they owe less)
      particulars = bill 
        ? `F&O Pay-In (${paymentMethod}) applied to bill ${bill.bill_number}` 
        : `F&O Pay-In received (${paymentMethod})`;
      referenceType = 'payment_received';
      
      // For broker: When party pays you, broker CREDIT (you take from broker)
      brokerDebitAmount = 0;
      brokerCreditAmount = amountValue;
      brokerParticulars = `Broker adjustment for client pay-in: ${party.party_code} paid ${amountValue}`;
    } else {
      // You pay party (Money OUT to party = you GIVE to party)
      // PARTY CREDIT: Party is owed more, you pay money
      debitAmount = 0;
      creditAmount = amountValue;
      newBalance = currentBalance - amountValue;  // Balance decreases (you owe less)
      particulars = bill 
        ? `F&O Pay-Out (${paymentMethod}) for bill ${bill.bill_number}` 
        : `F&O Pay-Out made (${paymentMethod})`;
      referenceType = 'payment_made';
      
      // For broker: When you pay party, broker DEBIT (you give to broker)
      brokerDebitAmount = amountValue;
      brokerCreditAmount = 0;
      brokerParticulars = `Broker adjustment for client pay-out: ${party.party_code} received ${amountValue}`;
    }
    
    const paymentNumber = `FO-PAY${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const paymentInsert = await client.query(
      `INSERT INTO fo_payments
        (payment_number, party_id, bill_id, payment_date, amount, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        paymentNumber,
        party_id,
        foBillId,
        date,
        amountValue,
        paymentMethod,
        notes || null
      ]
    );
    const foPaymentId = paymentInsert.rows[0].id;
    
    const ledgerInsert = await client.query(
      `INSERT INTO fo_ledger_entries 
        (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        party_id,
        date,
        particulars,
        debitAmount,
        creditAmount,
        newBalance,
        referenceType,
        foPaymentId
      ]
    );
    
    // Create corresponding broker ledger entry
    // Get main broker party ID (you may need to adjust this based on your setup)
    const brokerResult = await client.query(
      `SELECT id FROM party_master WHERE party_code = 'MAIN-BROKER' LIMIT 1`
    );
    
    let brokerLedgerEntry = null;
    if (brokerResult.rows.length > 0) {
      const brokerPartyId = brokerResult.rows[0].id;
      
      // Get broker's current balance
      const brokerLedgerResult = await client.query(
        `SELECT balance FROM fo_ledger_entries 
         WHERE party_id = $1
         ORDER BY entry_date DESC, created_at DESC LIMIT 1`,
        [brokerPartyId]
      );
      
      const currentBrokerBalance = brokerLedgerResult.rows.length > 0 ? 
        parseFloat(brokerLedgerResult.rows[0].balance) : 0;
      
      brokerNewBalance = currentBrokerBalance + brokerCreditAmount - brokerDebitAmount;
      
      brokerLedgerEntry = await client.query(
        `INSERT INTO fo_ledger_entries 
          (party_id, entry_date, particulars, debit_amount, credit_amount, balance, 
           reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          brokerPartyId, 
          date, 
          brokerParticulars,
          brokerDebitAmount,
          brokerCreditAmount,
          brokerNewBalance,
          referenceType,
          foPaymentId
        ]
      );
    }
    
    if (bill && foBillId) {
      const newPaidAmount = parseFloat(bill.paid_amount) + amountValue;
      const isFullyPaid = newPaidAmount >= parseFloat(bill.total_amount) - 0.01;
      await client.query(
        `UPDATE fo_bills
         SET paid_amount = $1, status = $2, updated_at = NOW()
         WHERE id = $3`,
        [
          newPaidAmount,
          isFullyPaid ? 'paid' : 'partially_paid',
          foBillId
        ]
      );
    }
    
    await client.query('COMMIT');
    const responseEntries = [ledgerInsert.rows[0]];
    if (brokerLedgerEntry) {
      responseEntries.push(brokerLedgerEntry.rows[0]);
    }
    
    res.json({
      success: true,
      payment_id: foPaymentId,
      applied_to: foBillId,
      new_balance: newBalance,
      ledger_entries: responseEntries
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing F&O payment:', error);
    res.status(500).json({
      error: 'Failed to process F&O payment',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Record F&O broker payment (for F&O broker bills)
// NOTE: this is a thin helper around the generic /api/fo/payments logic,
//       so that UI code that only knows billId can still record a payment.
app.post('/api/fo/bills/:billId/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { billId } = req.params;
    const { amount, payment_date, payment_method, notes } = req.body;

    // Basic validation
    const amountValue = Number(amount);
    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    await client.query('BEGIN');

    // Get bill details
    const billResult = await client.query('SELECT * FROM fo_bills WHERE id = $1', [billId]);
    if (billResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Bill not found' });
    }
    const bill = billResult.rows[0];

    const isBrokerBill = bill.bill_type === 'broker';
    // For broker bills, party_id will typically be NULL; that's OK.
    const partyId = bill.party_id || null;

    // Generate payment number
    const now = new Date();
    const paymentNumber = `FO-PAY${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    // Insert payment record (schema does not have reference_number column)
    const paymentInsert = await client.query(
      'INSERT INTO fo_payments (payment_number, party_id, bill_id, payment_date, amount, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [paymentNumber, partyId, billId, payment_date, amountValue, payment_method || 'cash', notes || null]
    );

    // Update bill paid amount and status (treat NULL as 0)
    const currentPaid = Number(bill.paid_amount || 0);
    const billTotal = Number(bill.total_amount || 0);
    const newPaidAmount = currentPaid + amountValue;
    const isFullyPaid = newPaidAmount >= billTotal - 0.01;
    const newStatus = isFullyPaid ? 'paid' : 'partially_paid';

    await client.query(
      'UPDATE fo_bills SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [newPaidAmount, newStatus, billId]
    );

    // For F&O party bills, also create a client ledger entry so balance moves with payments.
    if (partyId && !isBrokerBill) {
      // Get last balance
      const balRes = await client.query(
        `SELECT balance FROM fo_ledger_entries
         WHERE party_id = $1
         ORDER BY entry_date DESC, created_at DESC
         LIMIT 1`,
        [partyId]
      );
      const currentBalance = balRes.rows.length > 0 ? Number(balRes.rows[0].balance) || 0 : 0;

      // Convention: positive balance = client owes you.
      // A payment from client (for a bill) is a Pay-In ? reduces balance.
      // If current balance is negative (you owe broker), a payment should make it less negative (closer to zero)
            const newBalance = currentBalance >= 0 
              ? currentBalance - amountValue 
              : currentBalance + amountValue;

      await client.query(
        `INSERT INTO fo_ledger_entries
           (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          partyId,
          payment_date || now.toISOString().slice(0, 10),
          `F&O Pay-In (bill ${bill.bill_number || billId})`,
          0,
          amountValue,
          newBalance,
          'payment_received',
          paymentInsert.rows[0].id,
        ]
      );
    }

    // For broker bills, update main broker ledger (party_id NULL, broker_brokerage account)
    if (isBrokerBill) {
      // Get last broker_brokerage balance
      const balRes = await client.query(
        `SELECT balance FROM fo_ledger_entries
         WHERE party_id IS NULL AND reference_type = $1
         ORDER BY entry_date DESC, created_at DESC
         LIMIT 1`,
        ['broker_brokerage']
      );
      const currentBalance = balRes.rows.length > 0 ? Number(balRes.rows[0].balance) || 0 : 0;

      // Convention: positive balance = you owe main broker (credit from bills).
      // A payment FROM main broker (to you) reduces that balance.
      // If current balance is negative (you owe broker), a payment should make it less negative (closer to zero)
            const newBalance = currentBalance >= 0 
              ? currentBalance - amountValue 
              : currentBalance + amountValue;

      await client.query(
        `INSERT INTO fo_ledger_entries
           (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          null,
          payment_date || now.toISOString().slice(0, 10),
          `Main Broker Payment (bill ${bill.bill_number || billId})`,
          0,  // debit_amount (changed from amountValue)
          amountValue,  // credit_amount (changed from 0)
          newBalance,
          'broker_payment',
          paymentInsert.rows[0].id,
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentNumber,
      newPaidAmount,
      newStatus,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording F&O payment:', error);
    res.status(500).json({ error: 'Failed to record payment', details: error.message });
  } finally {
    client.release();
  }
});

// =========================
// CASH MODULE API ROUTES
// =========================

// Create cash transaction (Receipt/Payment) + auto ledger entry
app.post('/api/cash/create', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      date,
      party_code,
      amount,
      type,       // 'RECEIPT' | 'PAYMENT'
      narration,
      created_by,
      module,     // optional: 'equity' | 'fo'
    } = req.body || {};

    if (!date || !party_code || !amount || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['date', 'party_code', 'amount, type'],
      });
    }

    const normType = String(type).toUpperCase();
    if (normType !== 'RECEIPT' && normType !== 'PAYMENT') {
      return res.status(400).json({ error: 'type must be RECEIPT or PAYMENT' });
    }

    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'amount must be > 0' });
    }

    await client.query('BEGIN');

    const cashRes = await client.query(
      `INSERT INTO cash_transactions
         (date, party_code, amount, type, narration, mode, created_by)
       VALUES ($1, $2, $3, $4, $5, 'CASH', $6)
       RETURNING *`,
      [date, party_code, amountValue, normType, narration || null, created_by || null]
    );
    const cash = cashRes.rows[0];

    const partyId = await getPartyIdByCode(party_code);
    let ledgerEntry = null;
    let foLedgerEntry = null;
    const moduleNorm = (module || 'equity').toString().toLowerCase();

    if (partyId) {
      // Always create Equity cash ledger entry
      ledgerEntry = await insertCashLedgerEntry(client, {
        partyId,
        date,
        type: normType,
        amount: amountValue,
        narration,
        cashId: cash.id,
      });

      // If this cash entry is for F&O, mirror it into fo_ledger_entries so FO summary sees it
      if (moduleNorm === 'fo') {
        // Get latest FO balance for this party
        const foBalRes = await client.query(
          `SELECT balance FROM fo_ledger_entries
           WHERE party_id = $1
           ORDER BY entry_date DESC, created_at DESC
           LIMIT 1`,
          [partyId]
        );
        const currentFoBalance = foBalRes.rows.length > 0
          ? Number(foBalRes.rows[0].balance) || 0
          : 0;

        let foDebit = 0;
        let foCredit = 0;
        let newFoBalance = currentFoBalance;

        if (normType === 'RECEIPT') {
          // Cash RECEIPT from FO client = Pay-In → credit, reduce what they owe
          foCredit = amountValue;
          newFoBalance = currentFoBalance - amountValue;
        } else if (normType === 'PAYMENT') {
          // Cash PAYMENT to FO client = Pay-Out → debit, move balance towards 0
          foDebit = amountValue;
          newFoBalance = currentFoBalance >= 0
            ? currentFoBalance - amountValue
            : currentFoBalance + amountValue;
        }

        const foParticulars = `F&O CASH ${normType} - ${narration || party_code}`.trim();

        const foRes = await client.query(
          `INSERT INTO fo_ledger_entries
             (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            partyId,
            date,
            foParticulars,
            foDebit,
            foCredit,
            newFoBalance,
            'cash',
            cash.id,
          ]
        );
        foLedgerEntry = foRes.rows[0];
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      cash: cash,
      ledger_entry: ledgerEntry,
      fo_ledger_entry: foLedgerEntry,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating cash transaction:', error);
    return res.status(500).json({ error: 'Failed to create cash transaction', details: error.message });
  } finally {
    client.release();
  }
});

// Daily cash book
app.get('/api/cash/book', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    }

    // Opening = RECEIPT - PAYMENT before date
    const openRes = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END), 0) AS total_receipts,
         COALESCE(SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END), 0) AS total_payments
       FROM cash_transactions
       WHERE date < $1`,
      [date]
    );

    const openingReceipts = Number(openRes.rows[0].total_receipts) || 0;
    const openingPayments = Number(openRes.rows[0].total_payments) || 0;
    const opening_balance = openingReceipts - openingPayments;

    // Get cash transactions for the date
    const dayRes = await pool.query(
      `SELECT *
      
         FROM cash_transactions
        WHERE date = $1
        ORDER BY created_at ASC`,
      [date]
    );

    const cashRows = dayRes.rows || [];

    // Get payment ledger entries for the date that should appear in cash book (Equity)
    const paymentEntriesRes = await pool.query(
      `SELECT 
         l.entry_date as date,
         p.party_code,
         l.credit_amount as amount,
         'RECEIPT' as type,
         l.particulars as narration,
         l.created_at,
         l.id::text
       FROM ledger_entries l
       JOIN party_master p ON l.party_id = p.id
       WHERE l.entry_date = $1 
         AND l.reference_type = 'payment_received'
         AND l.credit_amount > 0
       UNION ALL
       SELECT 
         l.entry_date as date,
         p.party_code,
         l.debit_amount as amount,
         'PAYMENT' as type,
         l.particulars as narration,
         l.created_at,
         l.id::text
       FROM ledger_entries l
       JOIN party_master p ON l.party_id = p.id
       WHERE l.entry_date = $1 
         AND l.reference_type = 'payment_made'
         AND l.debit_amount > 0
       UNION ALL
       -- Main Broker payments (party_id NULL, reference_type='broker_payment')
       SELECT
         l.entry_date as date,
         'MAIN-BROKER' as party_code,
         l.credit_amount as amount,
         'PAYMENT' as type,
         l.particulars as narration,
         l.created_at,
         l.id::text
       FROM ledger_entries l
       WHERE l.entry_date = $1
         AND l.party_id IS NULL
         AND l.reference_type = 'broker_payment'
         AND l.credit_amount > 0
       UNION ALL
       -- F&O Payment Entries
       SELECT 
         l.entry_date as date,
         p.party_code,
         l.credit_amount as amount,
         'RECEIPT' as type,
         l.particulars as narration,
         l.created_at,
         l.id::text
       FROM fo_ledger_entries l
       JOIN party_master p ON l.party_id = p.id
       WHERE l.entry_date = $1 
         AND l.reference_type = 'payment_received'
         AND l.credit_amount > 0
       UNION ALL
       SELECT 
         l.entry_date as date,
         p.party_code,
         l.debit_amount as amount,
         'PAYMENT' as type,
         l.particulars as narration,
         l.created_at,
         l.id::text
       FROM ledger_entries l
       JOIN party_master p ON l.party_id = p.id
       WHERE l.entry_date = $1 
         AND l.reference_type = 'payment_made'
         AND l.debit_amount > 0
       UNION ALL
       -- F&O main broker payments (party_id NULL, reference_type='broker_payment')
       SELECT
         l.entry_date as date,
         'MAIN-BROKER' as party_code,
         l.credit_amount as amount,
         'PAYMENT' as type,
         l.particulars as narration,
         l.created_at,
         l.id::text
       FROM fo_ledger_entries l
       WHERE l.entry_date = $1
         AND l.party_id IS NULL
         AND l.reference_type = 'broker_payment'
         AND l.credit_amount > 0
       ORDER BY created_at ASC`,
      [date]
    );

    const paymentRows = paymentEntriesRes.rows || [];

    // Combine cash transactions and payment ledger entries
    const allRows = [...cashRows, ...paymentRows].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Calculate receipts and payments
    const receipts = allRows
      .filter(r => r.type === 'RECEIPT')
      .reduce((s, r) => s + Number(r.amount || 0), 0);

    const payments = allRows
      .filter(r => r.type === 'PAYMENT')
      .reduce((s, r) => s + Number(r.amount || 0), 0);

    const closing_balance = opening_balance + receipts - payments;

    return res.json({
      date,
      opening_balance,
      receipts,
      payments,
      closing_balance,
      transactions: allRows,
    });
  } catch (error) {
    console.error('Error fetching cash book:', error);
    return res.status(500).json({ error: 'Failed to fetch cash book', details: error.message });
  }
});

// Party-wise cash ledger (only cash transactions)
app.get('/api/cash/ledger', async (req, res) => {
  try {
    const { party_code } = req.query;

    if (!party_code) {
      return res.status(400).json({ error: 'party_code is required' });
    }

    const code = String(party_code).toUpperCase();

    const txRes = await pool.query(
      `SELECT *
         FROM cash_transactions
        WHERE UPPER(party_code) = $1
        ORDER BY date ASC, created_at ASC`,
      [code]
    );

    const txs = txRes.rows || [];
    let running = 0;
    const ledger = txs.map(row => {
      const amt = Number(row.amount || 0);
      let debit = 0;
      let credit = 0;

      if (row.type === 'RECEIPT') {
        credit = amt;
        running += amt;
      } else if (row.type === 'PAYMENT') {
        debit = amt;
        running -= amt;
      }

      return {
        date: row.date,
        party_code: row.party_code,
        type: row.type,
        narration: row.narration,
        debit,
        credit,
        balance: running,
      };
    });

    return res.json({
      party_code: code,
      opening_balance: 0,
      entries: ledger,
      closing_balance: running,
    });
  } catch (error) {
    console.error('Error fetching cash ledger:', error);

  }
});

app.get('/api/cash/summary', async (req, res) => {
  try {
    const { code } = req.query;

    const result = await pool.query(
      'SELECT SUM(debit) AS total_debit, SUM(credit) AS total_credit FROM cash_ledger WHERE party_code = $1',
      [code]
    );

    const { total_debit, total_credit } = result.rows[0];
    const closing_balance = total_debit - total_credit;

    return res.json({
      party_code: code,
      total_debit,
      total_credit,
      closing_balance,
    });
  } catch (error) {
    console.error('Error fetching cash summary:', error);
    return res.status(500).json({ error: 'Failed to fetch cash summary', details: error.message });
  }
});

// Cash summary by party (total debit, credit, closing balance)
app.get('/api/cash/summary', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         p.party_code,
         p.name AS party_name,
         COALESCE(SUM(CASE WHEN ct.type = 'PAYMENT' THEN ct.amount ELSE 0 END), 0) AS total_debit,
         COALESCE(SUM(CASE WHEN ct.type = 'RECEIPT' THEN ct.amount ELSE 0 END), 0) AS total_credit,
         COALESCE(SUM(CASE WHEN ct.type = 'RECEIPT' THEN ct.amount ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN ct.type = 'PAYMENT' THEN ct.amount ELSE 0 END), 0) AS closing_balance
       FROM cash_transactions ct
       LEFT JOIN party_master p ON UPPER(p.party_code) = UPPER(ct.party_code)
       GROUP BY p.party_code, p.name
       ORDER BY p.party_code`
    );

    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching cash summary:', error);
    return res.status(500).json({ error: 'Failed to fetch cash summary', details: error.message });
  }
});

// Recent cash transactions (last 50)
app.get('/api/cash/recent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
         FROM cash_transactions
        ORDER BY created_at DESC
        LIMIT 50`
    );

    return res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching recent cash transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch recent cash transactions', details: error.message });
  }
});

// Nuclear reset endpoint - DELETES ALL DATA
app.post('/api/nuclear-reset', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('???? NUCLEAR RESET INITIATED - Deleting all data...');
    
    // Truncate all tables in correct order (respecting foreign keys)
    const tables = [
      'payments',
      'bill_items',
      'bills',
      'ledger_entries',
      'stock_holdings',
      'contracts',
      'company_master',
      'party_master',
      'broker_master',
      'settlement_master'
    ];
    
    for (const table of tables) {
      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      console.log(`  ??? Cleared ${table}`);
    }
    
    await client.query('COMMIT');
    console.log('???? NUCLEAR RESET COMPLETE - All data deleted');
    
    res.json({ 
      success: true, 
      message: 'All data has been permanently deleted',
      tables_cleared: tables
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Nuclear reset error:', error);
    res.status(500).json({ error: 'Failed to complete nuclear reset', details: error.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// F&O INSTRUMENTS API
// ============================================================================

// Get all F&O instruments
app.get('/api/fo/instruments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fo_instrument_master ORDER BY expiry_date DESC, symbol, instrument_type'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching F&O instruments:', error);
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

// Get single F&O instrument
app.get('/api/fo/instruments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM fo_instrument_master WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instrument not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching instrument:', error);
    res.status(500).json({ error: 'Failed to fetch instrument' });
  }
});

// Create F&O instrument
app.post('/api/fo/instruments', async (req, res) => {
  try {
    const { 
      symbol, 
      instrument_type, 
      expiry_date, 
      strike_price, 
      lot_size, 
      segment, 
      underlying_asset, 
      tick_size, 
      display_name, 
      is_active 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO fo_instrument_master 
        (symbol, instrument_type, expiry_date, strike_price, lot_size, segment, underlying_asset, tick_size, display_name, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        symbol,
        instrument_type,
        expiry_date,
        strike_price,
        lot_size,
        segment || 'NFO',
        underlying_asset,
        tick_size || 0.05,
        display_name,
        is_active !== false
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating instrument:', error);
    res.status(500).json({ error: 'Failed to create instrument', details: error.message });
  }
});

// Update F&O instrument
app.put('/api/fo/instruments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      symbol, 
      instrument_type, 
      expiry_date, 
      strike_price, 
      lot_size, 
      segment, 
      underlying_asset, 
      tick_size, 
      display_name, 
      is_active 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE fo_instrument_master 
       SET symbol = $1, instrument_type = $2, expiry_date = $3, strike_price = $4, 
           lot_size = $5, segment = $6, underlying_asset = $7, tick_size = $8, 
           display_name = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 
       RETURNING *`,
      [
        symbol,
        instrument_type,
        expiry_date,
        strike_price,
        lot_size,
        segment,
        underlying_asset,
        tick_size,
        display_name,
        is_active,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instrument not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating instrument:', error);
    res.status(500).json({ error: 'Failed to update instrument' });
  }
});

// Delete F&O instrument
app.delete('/api/fo/instruments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fo_instrument_master WHERE id = $1', [id]);
    res.json({ message: 'Instrument deleted successfully' });
  } catch (error) {
    console.error('Error deleting instrument:', error);
    res.status(500).json({ error: 'Failed to delete instrument' });
  }
});

// Import F&O trades from CSV and create contracts with broker information
app.post('/api/fo/trades/import', async (req, res) => {
  const client = await pool.connect();
  try {
    const { trades, billDate } = req.body || {};
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'trades array is required' });
    }

    await client.query('BEGIN');

    const now = new Date();
    let billDateStr = now.toISOString().slice(0, 10);
    if (typeof billDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(billDate)) {
      billDateStr = billDate;
    }

    const imported = [];
    const clientGroups = {};

    // Group trades by client
    for (const trade of trades) {
      const clientId = (trade.ClientId || trade.clientId || '').toString().trim().toUpperCase();
      if (!clientId) continue;
      
      if (!clientGroups[clientId]) clientGroups[clientId] = [];
      clientGroups[clientId].push(trade);
    }

    // Process each client
    for (const [clientId, clientTrades] of Object.entries(clientGroups)) {
      // Get party details
      const partyQuery = await client.query(
        'SELECT id, party_code, name, trading_slab, delivery_slab FROM party_master WHERE UPPER(party_code) = $1',
        [clientId]
      );

      if (partyQuery.rows.length === 0) {
        console.warn(`Party not found: ${clientId}`);
        continue;
      }

      const party = partyQuery.rows[0];

      // Process each F&O trade for this client
      for (const trade of clientTrades) {
        let symbol = (trade.Symbol || trade.symbol || trade.SecurityName || trade.securityName || '').toString().toUpperCase();
        let instrumentType = (trade.InstrumentType || trade.instrumentType || 'FUT').toString().toUpperCase();
        let expiryDate = trade.ExpiryDate || trade.expiryDate || '';
        let strikePrice = Number(trade.StrikePrice || trade.strikePrice || 0);
        
        // Parse ExpiryDate if it's in format like "25NOV2025" or "25NOV25"
        if (expiryDate && typeof expiryDate === 'string') {
          const expiryMatch = expiryDate.match(/(\d{2})([A-Z]{3})(\d{2,4})/);
          if (expiryMatch) {
            const day = expiryMatch[1];
            const month = expiryMatch[2];
            let year = expiryMatch[3];
            if (year.length === 2) year = '20' + year;
            
            const monthMap = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
              'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
              'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const monthNum = monthMap[month] || '01';
            expiryDate = `${year}-${monthNum}-${day}`;
          }
        }
        
        // Parse SecurityName if Symbol is not provided (format: NIFTY25OCT24800PE)
        const securityName = (trade.SecurityName || trade.securityName || '').toString().toUpperCase();
        if (securityName && !symbol) {
          // Try to match F&O format: NIFTY25OCT24800PE
          const foMatch = securityName.match(/^([A-Z]+)(\d{2})([A-Z]{3})(\d+)(CE|PE)$/);
          if (foMatch) {
            symbol = foMatch[1];
            const day = foMatch[2];
            const month = foMatch[3];
            strikePrice = Number(foMatch[4]);
            instrumentType = foMatch[5];
            
            const monthMap = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
              'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
              'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const monthNum = monthMap[month] || '01';
            
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const expiryMonth = parseInt(monthNum);
            const year = (expiryMonth < currentMonth) ? currentYear + 1 : currentYear;
            
            expiryDate = `${year}-${monthNum}-${day}`;
          } else {
            symbol = securityName;
            instrumentType = 'FUT';
            
            const rawTradeDate = trade.TradeDate || trade.tradeDate || trade.Date || billDateStr;
            if (rawTradeDate) {
              const d = new Date(rawTradeDate);
              if (!isNaN(d.getTime())) {
                expiryDate = d.toISOString().slice(0, 10);
              } else {
                expiryDate = billDateStr;
              }
            } else {
              expiryDate = billDateStr;
            }
            
            strikePrice = 0;
          }
        }
        
        const side = (trade.Side || trade.side || '').toString().trim().toUpperCase();
        
        // Get quantity (in lots)
        let lotQuantity = 0;
        if (side === 'BUY') {
          lotQuantity = Number(trade.BuyQty || trade.Quantity || trade.quantity || 0);
        } else if (side === 'SELL') {
          lotQuantity = Number(trade.SellQty || trade.Quantity || trade.quantity || 0);
        } else {
          lotQuantity = Number(trade.BuyQty || trade.SellQty || trade.Quantity || trade.quantity || 0);
        }
        
        // Get price
        let price = 0;
        if (side === 'BUY') {
          price = Number(trade.BuyAvg || trade.Price || trade.price || 0);
        } else if (side === 'SELL') {
          price = Number(trade.SellAvg || trade.Price || trade.price || 0);
        } else {
          price = Number(trade.BuyAvg || trade.SellAvg || trade.Price || trade.price || 0);
        }
        
        const type = (trade.Type || trade.type || 'T').toString().toUpperCase();
        const isCarryForward = type === 'CF';
        
        // Skip if quantity or price is 0
        if (lotQuantity === 0 || price === 0) {
          console.warn(`Skipping F&O trade with zero quantity or price: ${symbol}`);
          continue;
        }

        // Find instrument in database
        let instrument = null;
        let lotSize = 1;
        
        let instrumentQuery;
        const expiryDateValue = expiryDate || null;
        
        if (instrumentType === 'FUT') {
          instrumentQuery = await client.query(
            'SELECT * FROM fo_instrument_master WHERE UPPER(symbol) = $1 AND instrument_type = $2 AND (expiry_date = $3 OR ($3 IS NULL AND expiry_date IS NULL)) AND is_active = true',
            [symbol, 'FUT', expiryDateValue]
          );
        } else if (instrumentType === 'CE' || instrumentType === 'PE') {
          instrumentQuery = await client.query(
            'SELECT * FROM fo_instrument_master WHERE UPPER(symbol) = $1 AND instrument_type = $2 AND (expiry_date = $3 OR ($3 IS NULL AND expiry_date IS NULL)) AND strike_price = $4 AND is_active = true',
            [symbol, instrumentType, expiryDateValue, strikePrice]
          );
        }
        
        if (instrumentQuery && instrumentQuery.rows.length > 0) {
          instrument = instrumentQuery.rows[0];
          lotSize = Number(instrument.lot_size) || 1;
        } else {
          // Auto-create instrument if not found
          console.log(`Auto-creating F&O instrument: ${symbol} ${instrumentType}`);
          
          // Ensure we have a valid expiry date, default to 1 month from now if missing
          let validExpiryDate = expiryDateValue;
          if (!validExpiryDate) {
            const defaultExpiry = new Date();
            defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
            validExpiryDate = defaultExpiry.toISOString().slice(0, 10);
          }
          
          let displayName = symbol;
          if (validExpiryDate) {
            const expiryParts = validExpiryDate.split('-');
            if (expiryParts.length === 3) {
              const monthNum = expiryParts[1];
              const day = expiryParts[2];
              const monthMap = {
                '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
                '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
                '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
              };
              const monthStr = monthMap[monthNum] || 'JAN';
              displayName = `${symbol}${day}${monthStr}`;
              if (strikePrice) {
                displayName += Math.round(strikePrice).toString();
              }
            }
          }
          if (instrumentType === 'CE' || instrumentType === 'PE') {
            displayName += instrumentType;
          }
          
          const newInstrumentResult = await client.query(
            `INSERT INTO fo_instrument_master 
              (symbol, instrument_type, expiry_date, strike_price, lot_size, segment, underlying_asset, display_name, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [
              symbol,
              instrumentType,
              validExpiryDate,
              strikePrice || null,
              lotSize,
              'NFO',
              symbol,
              displayName,
              true
            ]
          );
          instrument = newInstrumentResult.rows[0];
        }

        // Calculate actual quantity (lots * lot size)
        const actualQuantity = lotQuantity * lotSize;
        const amount = actualQuantity * price;
        
        // Calculate brokerage (CF has 0 brokerage, others have normal brokerage)
        const brokerageRate = isCarryForward ? 0 : (type === 'T' ? Number(party.trading_slab) : Number(party.delivery_slab));
        const brokerageAmount = isCarryForward ? 0 : (amount * brokerageRate) / 100;

        // Get broker information
        let brokerId = null;
        let brokerCode = null;
        
        // Check for broker ID in various formats
        const brokerIdRaw = trade.brokerid || trade.brokerId || trade.BrokerId || trade.BrokerID || '';
        if (brokerIdRaw) {
          // Try to find broker by broker_code (not UUID)
          const brokerCodeRaw = brokerIdRaw.toString().toUpperCase();
          const brokerQuery = await client.query(
            'SELECT id, broker_code FROM broker_master WHERE UPPER(broker_code) = $1',
            [brokerCodeRaw]
          );
          
          if (brokerQuery.rows.length > 0) {
            brokerId = brokerQuery.rows[0].id;
            brokerCode = brokerQuery.rows[0].broker_code;
          } else {
            console.warn(`Broker not found: ${brokerIdRaw}`);
          }
        }

        // Create contract with broker information
        const tradeDateValue = trade.TradeDate || trade.tradeDate || trade.Date || billDateStr;
        const contractNumber = `FO-${party.party_code}-${instrument.symbol}-${new Date(tradeDateValue).getTime()}-${Math.floor(Math.random() * 1000)}`;
        
        const contractResult = await client.query(
          `INSERT INTO fo_contracts 
            (contract_number, party_id, instrument_id, broker_id, broker_code, trade_date, 
             trade_type, side, quantity, price, amount, brokerage_rate, brokerage_amount, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
           RETURNING *`,
          [
            contractNumber, 
            party.id, 
            instrument.id, 
            brokerId, 
            brokerCode,
            tradeDateValue,
            type,
            side,
            actualQuantity,
            price,
            amount,
            brokerageRate,
            brokerageAmount,
            'open',
            'Imported from trading file'
          ]
        );

        // Update FO positions immediately on import so "Current Positions" is not empty.
        // We treat:
        //  BUY  => +qty
        //  SELL => -qty
        const posRes = await client.query(
          'SELECT * FROM fo_positions WHERE party_id = $1 AND instrument_id = $2',
          [party.id, instrument.id]
        );

        if (posRes.rows.length > 0) {
          const position = posRes.rows[0];
          const currentQty = Number(position.quantity) || 0;
          const currentAvg = Number(position.avg_price) || 0;

          let newQty = currentQty;
          let newAvg = currentAvg;

          if (side === 'BUY') {
            // If we are short, BUY reduces the short; if it flips to long, reset avg to this price.
            newQty = currentQty + actualQuantity;
            if (currentQty >= 0) {
              const totalCost = (currentQty * currentAvg) + (actualQuantity * price);
              newAvg = newQty !== 0 ? (totalCost / newQty) : price;
            } else if (newQty > 0) {
              newAvg = price;
            }
          } else if (side === 'SELL') {
            // If we are long, SELL reduces the long; if it flips to short, reset avg to this price.
            newQty = currentQty - actualQuantity;
            if (currentQty <= 0) {
              const curAbs = Math.abs(currentQty);
              const newAbs = Math.abs(newQty);
              const totalShortValue = (curAbs * currentAvg) + (actualQuantity * price);
              newAvg = newAbs !== 0 ? (totalShortValue / newAbs) : price;
            } else if (newQty < 0) {
              newAvg = price;
            }
          }

          const status = Math.abs(newQty) < 0.01 ? 'closed' : 'open';

          await client.query(
            'UPDATE fo_positions SET quantity = $1, avg_price = $2, last_trade_date = $3, status = $4, last_updated = CURRENT_TIMESTAMP WHERE id = $5',
            [newQty, newAvg, tradeDateValue, status, position.id]
          );
        } else {
          const qty = side === 'SELL' ? -actualQuantity : actualQuantity;
          const status = Math.abs(qty) < 0.01 ? 'closed' : 'open';
          await client.query(
            'INSERT INTO fo_positions (party_id, instrument_id, quantity, avg_price, last_trade_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [party.id, instrument.id, qty, price, tradeDateValue, status]
          );
        }

        imported.push({ 
          clientId, 
          instrumentId: instrument.id, 
          qty: actualQuantity, 
          price,
          brokerId,
          brokerCode
        });
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, importedCount: imported.length, importedData: imported });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing F&O trades:', error);
    res.status(500).json({ error: 'Failed to import F&O trades', details: error.message });
  } finally {
    client.release();
  }
});

// Process F&O trades and create ledger entries, positions, and bills
app.post('/api/fo/trades/process', async (req, res) => {
  const client = await pool.connect();
  try {
    const { trades, billDate } = req.body || {};
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'trades array is required' });
    }

    await client.query('BEGIN');

    const results = {
      clientBills: [],
      brokerEntries: [],
      ledgerEntries: [],
    };

    // Group trades by client
    const clientGroups = {};

    // Group F&O broker bill items per broker code
    // foBrokerGroups[brokerCode] = { items: [], totalBrokerageAllClients: 0 }
    const foBrokerGroups = {};
    let totalBrokerageAllClients = 0;
    for (const trade of trades) {
      const clientId = (trade.ClientId || trade.clientId || '').toString().trim().toUpperCase();
      if (!clientId) continue;
      
      if (!clientGroups[clientId]) clientGroups[clientId] = [];
      clientGroups[clientId].push(trade);
    }

    const now = new Date();
    // Use provided billDate (YYYY-MM-DD) if valid; otherwise fallback to system date
    let billDateStr = now.toISOString().slice(0, 10);
    if (typeof billDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(billDate)) {
      billDateStr = billDate;
    }

    // Process each client
    for (const [clientId, clientTrades] of Object.entries(clientGroups)) {
      // Get party details
      const partyQuery = await client.query(
        'SELECT id, party_code, name, trading_slab, delivery_slab FROM party_master WHERE UPPER(party_code) = $1',
        [clientId]
      );

      if (partyQuery.rows.length === 0) {
        console.warn(`Party not found: ${clientId}`);
        continue;
      }

      const party = partyQuery.rows[0];
      let totalBrokerage = 0;

      const billItems = [];
      let totalBuyAmount = 0;
      let totalSellAmount = 0;

      // Process each F&O trade
      for (const trade of clientTrades) {
        let symbol = (trade.Symbol || trade.symbol || '').toString().toUpperCase();
        let instrumentType = (trade.InstrumentType || trade.instrumentType || 'FUT').toString().toUpperCase();
        let expiryDate = trade.ExpiryDate || trade.expiryDate || '';
        let strikePrice = Number(trade.StrikePrice || trade.strikePrice || 0);
        
        // Parse ExpiryDate if it's in format like "25NOV2025" or "25NOV25"
        if (expiryDate && typeof expiryDate === 'string') {
          const expiryMatch = expiryDate.match(/(\d{2})([A-Z]{3})(\d{2,4})/);
          if (expiryMatch) {
            const day = expiryMatch[1];
            const month = expiryMatch[2];
            let year = expiryMatch[3];
            if (year.length === 2) year = '20' + year;
            
            const monthMap = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
              'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
              'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const monthNum = monthMap[month] || '01';
            expiryDate = `${year}-${monthNum}-${day}`;
          }
        }
        
        // Parse SecurityName if Symbol is not provided (format: NIFTY25OCT24800PE)
        const securityName = (trade.SecurityName || trade.securityName || '').toString().toUpperCase();
        if (securityName && !symbol) {
          // Try to match F&O format: NIFTY25OCT24800PE
          // Pattern: SYMBOL + DD + MMM + STRIKE + [CE|PE]
          // Example: NIFTY 25 OCT 24800 PE = NIFTY 25th Oct strike 24800 Put
          const foMatch = securityName.match(/^([A-Z]+)(\d{2})([A-Z]{3})(\d+)(CE|PE)$/);
          if (foMatch) {
            // F&O option with expiry date and strike
            symbol = foMatch[1]; // e.g., NIFTY
            const day = foMatch[2]; // e.g., 25
            const month = foMatch[3]; // e.g., OCT
            strikePrice = Number(foMatch[4]); // e.g., 24800 (full strike price)
            instrumentType = foMatch[5]; // CE or PE
            
            // Convert month to number and assume current/next year
            const monthMap = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
              'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
              'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            const monthNum = monthMap[month] || '01';
            
            // Determine year (if month has passed, it's next year)
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const expiryMonth = parseInt(monthNum);
            const year = (expiryMonth < currentMonth) ? currentYear + 1 : currentYear;
            
            expiryDate = `${year}-${monthNum}-${day}`;
          } else {
            // Simple stock symbol format: ADANIENT, BIOCON, VBL, CONCOR, etc.
            // Just use the SecurityName as the symbol, and treat as stock FUT.
            symbol = securityName;
            instrumentType = 'FUT'; // Default to FUT for stocks

            // For stock F&O, some files don't give an explicit expiry.
            // But our fo_instrument_master.expiry_date is NOT NULL, so we
            // must still store a valid date. Use trade date (or bill date)
            // as a surrogate expiry so that all CONCOR FUT trades for that
            // day share the same instrument.
            const rawTradeDate =
              trade.TradeDate || trade.tradeDate || trade.Date || billDateStr;
            if (rawTradeDate) {
              // Normalise to YYYY-MM-DD if it's a Date/string
              const d = new Date(rawTradeDate);
              if (!isNaN(d.getTime())) {
                expiryDate = d.toISOString().slice(0, 10);
              } else {
                expiryDate = billDateStr;
              }
            } else {
              expiryDate = billDateStr;
            }

            strikePrice = 0;
          }
        }
        
        const side = (trade.Side || trade.side || '').toString().toUpperCase();
        
        // Get quantity (in lots)
        let lotQuantity = 0;
        if (side === 'BUY') {
          lotQuantity = Number(trade.BuyQty || trade.Quantity || trade.quantity || 0);
        } else if (side === 'SELL') {
          lotQuantity = Number(trade.SellQty || trade.Quantity || trade.quantity || 0);
        } else {
          lotQuantity = Number(trade.BuyQty || trade.SellQty || trade.Quantity || trade.quantity || 0);
        }
        
        // Get price
        let price = 0;
        if (side === 'BUY') {
          price = Number(trade.BuyAvg || trade.Price || trade.price || 0);
        } else if (side === 'SELL') {
          price = Number(trade.SellAvg || trade.Price || trade.price || 0);
        } else {
          price = Number(trade.BuyAvg || trade.SellAvg || trade.Price || trade.price || 0);
        }
        
        const type = (trade.Type || trade.type || 'T').toString().toUpperCase(); // Default to Trading
        const isCarryForward = type === 'CF';
        
        // Skip if quantity or price is 0
        if (lotQuantity === 0 || price === 0) {
          console.warn(`Skipping F&O trade with zero quantity or price: ${symbol}`);
          continue;
        }

        // Find instrument in database
        let instrument = null;
        let lotSize = 1; // Default lot size
        
        // Build instrument query based on type
        let instrumentQuery;
        const expiryDateValue = expiryDate || null; // Convert empty string to null
        
        if (instrumentType === 'FUT') {
          instrumentQuery = await client.query(
            'SELECT * FROM fo_instrument_master WHERE UPPER(symbol) = $1 AND instrument_type = $2 AND (expiry_date = $3 OR ($3 IS NULL AND expiry_date IS NULL)) AND is_active = true',
            [symbol, 'FUT', expiryDateValue]
          );
        } else if (instrumentType === 'CE' || instrumentType === 'PE') {
          instrumentQuery = await client.query(
            'SELECT * FROM fo_instrument_master WHERE UPPER(symbol) = $1 AND instrument_type = $2 AND (expiry_date = $3 OR ($3 IS NULL AND expiry_date IS NULL)) AND strike_price = $4 AND is_active = true',
            [symbol, instrumentType, expiryDateValue, strikePrice]
          );
        }
        
        if (instrumentQuery && instrumentQuery.rows.length > 0) {
          instrument = instrumentQuery.rows[0];
          lotSize = Number(instrument.lot_size) || 1;
        } else {
          // Auto-create instrument if not found
          console.log(`Auto-creating F&O instrument: ${symbol} ${instrumentType}`);
          
          // Format display_name like NIFTY25OCT24800PE
          let displayName = symbol;
          if (expiryDate) {
            // Extract day and month from expiryDate (format: YYYY-MM-DD)
            const expiryParts = expiryDate.split('-');
            if (expiryParts.length === 3) {
              const monthNum = expiryParts[1];
              const day = expiryParts[2];
              const monthMap = {
                '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
                '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
                '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
              };
              const monthStr = monthMap[monthNum] || 'JAN';
              displayName = `${symbol}${day}${monthStr}`;
              if (strikePrice) {
                displayName += Math.round(strikePrice).toString();
              }
            }
          }
          if (instrumentType === 'CE' || instrumentType === 'PE') {
            displayName += instrumentType;
          }
          
          const newInstrumentResult = await client.query(
            `INSERT INTO fo_instrument_master 
              (symbol, instrument_type, expiry_date, strike_price, lot_size, segment, underlying_asset, display_name, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [
              symbol,
              instrumentType,
              expiryDateValue,
              strikePrice || null,
              lotSize, // Default lot size
              'NFO',
              symbol,
              displayName,
              true
            ]
          );
          instrument = newInstrumentResult.rows[0];
        }

        // Calculate actual quantity (lots * lot size)
        const actualQuantity = lotQuantity * lotSize;
        const amount = actualQuantity * price;
        
        // Calculate brokerage (CF has 0 brokerage, others have normal brokerage)
        const brokerageRate = isCarryForward ? 0 : (type === 'T' ? Number(party.trading_slab) : Number(party.delivery_slab));
        const brokerageAmount = isCarryForward ? 0 : (amount * brokerageRate) / 100;
        
        // Track buy/sell amounts (only for non-CF trades)
        if (!isCarryForward) {
          totalBrokerage += brokerageAmount;
          // For F&O: BUY means client owes us money (debit for client = credit for us)
          // SELL means we owe client money (credit for client = debit for us)
          if (side === 'BUY') {
            totalBuyAmount += amount;  // Client owes us money
          } else if (side === 'SELL') {
            totalSellAmount += amount; // We owe client money
          }
        }

        // NOTE: We do NOT create fo_contracts here during CSV upload
        // Contracts are created manually via the Contracts page
        // CSV upload only creates positions and bills

        // Update F&O position (CF and non-CF trades both update positions)
        // CF SELL: closes position and calculates P&L
        // CF BUY: reopens position at new price
        const positionQuery = await client.query(
          'SELECT * FROM fo_positions WHERE party_id = $1 AND instrument_id = $2 AND status = $3',
          [party.id, instrument.id, 'open']
        );

        let realizedPnL = 0;
        
        if (positionQuery.rows.length > 0) {
          // Update existing position
          const position = positionQuery.rows[0];
          const currentQty = Number(position.quantity);
          const currentAvgPrice = Number(position.avg_price);
          const currentTotalInvested = currentQty * currentAvgPrice;
          
          let newQty, newAvgPrice;
          
          if (side === 'BUY') {
            if (isCarryForward) {
              // CF BUY:
              // - If we have an OPEN SHORT (currentQty < 0), this BUY squares off that short
              //   and realizes P&L.
              // - Otherwise, treat as simple reopen at new price.
              if (currentQty < 0) {
                // SHORT rollover: BUY to square off existing short
                newQty = currentQty + actualQuantity; // currentQty is negative
                newAvgPrice = currentAvgPrice;
                // Realized P&L for closing short = (avg_short_price - buy_price) * qty
                realizedPnL = (currentAvgPrice - price) * actualQuantity;
              } else {
                // No existing short: reopen long at new price
                newQty = actualQuantity;
                newAvgPrice = price;
              }
            } else {
              // Normal BUY: Add to position
              newQty = currentQty + actualQuantity;
              const newTotalInvested = currentTotalInvested + amount;
              newAvgPrice = newQty !== 0 ? newTotalInvested / newQty : price;
            }
          } else {
            // SELL (CF or normal)
            newQty = currentQty - actualQuantity;
            newAvgPrice = currentAvgPrice; // Keep same avg price when selling
            
            // Calculate P&L for CF SELL (long rollover)
            if (isCarryForward) {
              realizedPnL = (price - currentAvgPrice) * actualQuantity;
            }
          }
          
          // Check if position is closed
          const positionStatus = Math.abs(newQty) < 0.01 ? 'closed' : 'open';
          
          await client.query(
            'UPDATE fo_positions SET quantity = $1, avg_price = $2, status = $3, last_updated = CURRENT_TIMESTAMP WHERE id = $4',
            [newQty, newAvgPrice, positionStatus, position.id]
          );
        } else {
          // Create new position
          const positionQty = side === 'BUY' ? actualQuantity : -actualQuantity;
          
          await client.query(
            `INSERT INTO fo_positions 
              (party_id, instrument_id, quantity, avg_price, status) 
             VALUES ($1, $2, $3, $4, $5)`,
            [party.id, instrument.id, positionQty, price, 'open']
          );
        }

        // CF trades: Include in party bill (with 0 brokerage)
        // P&L will be reflected in the party bill automatically (no separate ledger entry needed)
        if (isCarryForward) {
          const tradeDateValue = trade.TradeDate || trade.tradeDate || trade.Date || billDateStr;
          
          if (side === 'SELL' && realizedPnL !== 0) {
            // CF SELL: Long rollover – close long, realize P&L, then auto BUY next day
            console.log(`CF P&L calculated (LONG ROLLOVER): ${instrument.display_name || symbol} - ${side} ${actualQuantity}, P&L: ₹${realizedPnL.toFixed(2)}`);
            
            // AUTO-GENERATE CF BUY for next day (reopen LONG)
            // Calculate next working day (add 1 day, skip weekends if needed)
            const nextDay = new Date(tradeDateValue);
            nextDay.setDate(nextDay.getDate() + 1);
            
            // Skip Saturday (6) and Sunday (0)
            if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2); // Saturday -> Monday
            if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1); // Sunday -> Monday
            
            const nextDayStr = nextDay.toISOString().slice(0, 10);
            
            // Insert auto CF BUY contract
            await client.query(
              `INSERT INTO fo_contracts 
                (party_id, instrument_id, broker_id, broker_code, trade_date, trade_type, side, quantity, price, amount, brokerage_amount, status, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                party.id,
                instrument.id,
                null, // No broker for CF
                null,
                nextDayStr,
                'CF', // trade_type
                'BUY', // side
                actualQuantity,
                price,
                amount,
                0, // No brokerage for CF
                'open',
                `Auto-generated CF BUY after CF SELL on ${tradeDateValue}`
              ]
            );
            
            // Immediately process CF BUY: Update position (reopen at new price)
            const cfBuyPositionQuery = await client.query(
              'SELECT * FROM fo_positions WHERE party_id = $1 AND instrument_id = $2',
              [party.id, instrument.id]
            );
            
            if (cfBuyPositionQuery.rows.length > 0) {
              // Reopen closed position
              await client.query(
                'UPDATE fo_positions SET quantity = $1, avg_price = $2, status = $3, last_updated = CURRENT_TIMESTAMP WHERE id = $4',
                [actualQuantity, price, 'open', cfBuyPositionQuery.rows[0].id]
              );
            } else {
              // Create new position
              await client.query(
                `INSERT INTO fo_positions 
                  (party_id, instrument_id, quantity, avg_price, status) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [party.id, instrument.id, actualQuantity, price, 'open']
              );
            }
            
            // Create CF BUY bill and ledger entry
            const cfBillNumber = `PTY${nextDayStr.replace(/-/g, '')}-${Math.floor(Math.random() * 900) + 100}`;
            
            const cfBillResult = await client.query(
              'INSERT INTO fo_bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
              [cfBillNumber, party.id, nextDayStr, amount, 'party', 'pending']
            );
            
            const cfBillId = cfBillResult.rows[0].id;
            
            // Insert CF BUY bill item
            await client.query(
              'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type, side) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
              [
                cfBillId,
                `${instrument.display_name || symbol} - BUY (CF)`,
                actualQuantity,
                price,
                amount,
                clientId,
                instrument.id,
                0, // No brokerage for CF
                0,
                'CF',
            item.side || null
              ]
            );
            
            // Get current balance for CF BUY ledger
            let cfCurrentBalance = 0;
            const cfBalanceQuery = await client.query(
              'SELECT balance FROM fo_ledger_entries WHERE party_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
              [party.id]
            );
            if (cfBalanceQuery.rows.length > 0) {
              cfCurrentBalance = Number(cfBalanceQuery.rows[0].balance) || 0;
            }
            
            // CF BUY is a debit - party owes you, so balance becomes more negative
            const cfNewBalance = cfCurrentBalance - amount;
            
            // Create ledger entry for CF BUY with carry_forward_adjustment reference type
            await client.query(
              'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
              [
                party.id,
                nextDayStr,
                `F&O Bill ${cfBillNumber} - CF BUY Adjustment: ${instrument.display_name || symbol} (${actualQuantity} @ ?${price.toFixed(2)}) [Position Carry]`,
                amount,
                0,
                cfNewBalance,
                'carry_forward_adjustment',
                cfBillId
              ]
            );
            
            console.log(`Auto CF BUY processed for ${nextDayStr}: ${instrument.display_name || symbol} - BUY ${actualQuantity} @ ₹${price.toFixed(2)}, Bill: ${cfBillNumber}`);
          } else if (side === 'BUY' && realizedPnL !== 0) {
            // CF BUY: SHORT rollover – close short, realize P&L, then auto SELL next day
            console.log(`CF P&L calculated (SHORT ROLLOVER): ${instrument.display_name || symbol} - ${side} ${actualQuantity}, P&L: ₹${realizedPnL.toFixed(2)}`);

            // AUTO-GENERATE CF SELL for next day (reopen SHORT)
            const nextDay = new Date(tradeDateValue);
            nextDay.setDate(nextDay.getDate() + 1);
            if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2);
            if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().slice(0, 10);

            // Insert auto CF SELL contract
            await client.query(
              `INSERT INTO fo_contracts 
                (party_id, instrument_id, broker_id, broker_code, trade_date, trade_type, side, quantity, price, amount, brokerage_amount, status, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                party.id,
                instrument.id,
                null,
                null,
                nextDayStr,
                'CF', // trade_type
                'SELL', // side
                actualQuantity,
                price,
                amount,
                0,
                'open',
                `Auto-generated CF SELL after CF BUY on ${tradeDateValue}`
              ]
            );

            // Immediately process CF SELL: update position (reopen SHORT at new price)
            const cfSellPositionQuery = await client.query(
              'SELECT * FROM fo_positions WHERE party_id = $1 AND instrument_id = $2',
              [party.id, instrument.id]
            );

            const shortQty = -actualQuantity; // negative quantity = short
            if (cfSellPositionQuery.rows.length > 0) {
              await client.query(
                'UPDATE fo_positions SET quantity = $1, avg_price = $2, status = $3, last_updated = CURRENT_TIMESTAMP WHERE id = $4',
                [shortQty, price, 'open', cfSellPositionQuery.rows[0].id]
              );
            } else {
              await client.query(
                `INSERT INTO fo_positions 
                  (party_id, instrument_id, quantity, avg_price, status) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [party.id, instrument.id, shortQty, price, 'open']
              );
            }

            // Create CF SELL bill and ledger entry
            const cfBillNumber = `PTY${nextDayStr.replace(/-/g, '')}-${Math.floor(Math.random() * 900) + 100}`;
            const cfBillResult = await client.query(
              'INSERT INTO fo_bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
              [cfBillNumber, party.id, nextDayStr, amount, 'party', 'pending']
            );
            const cfBillId = cfBillResult.rows[0].id;

            await client.query(
              'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type, side) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
              [
                cfBillId,
                `${instrument.display_name || symbol} - SELL (CF)`,
                actualQuantity,
                price,
                amount,
                clientId,
                instrument.id,
                0,
                0,
                'CF',
                item.side || null
              ]
            );

            // Ledger for CF SELL
            let cfCurrentBalance = 0;
            const cfBalanceQuery = await client.query(
              'SELECT balance FROM fo_ledger_entries WHERE party_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
              [party.id]
            );
            if (cfBalanceQuery.rows.length > 0) {
              cfCurrentBalance = Number(cfBalanceQuery.rows[0].balance) || 0;
            }
            // CF SELL reduces what client owes (credit)
            const cfNewBalance = cfCurrentBalance + amount;

            await client.query(
              'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
              [
                party.id,
                nextDayStr,
                `F&O Bill ${cfBillNumber} - CF SELL Adjustment: ${instrument.display_name || symbol} (${actualQuantity} @ ₹${price.toFixed(2)}) [Position Carry]`,
                0,
                amount,
                cfNewBalance,
                'carry_forward_adjustment',
                cfBillId
              ]
            );

            console.log(`Auto CF SELL processed for ${nextDayStr}: ${instrument.display_name || symbol} - SELL ${actualQuantity} @ ₹${price.toFixed(2)}, Bill: ${cfBillNumber}`);
          }
          
          // Log CF trade (for tracking purposes)
          console.log(`CF trade processed: ${instrument.display_name || symbol} - ${side} ${actualQuantity} @ ₹${price.toFixed(2)}`);
        }
        
        // Add all trades to bill items (CF with 0 brokerage, normal with brokerage)
        const brokerCodeFromTrade = (trade.brokerid || trade.brokerId || trade.BrokerId || trade.BrokerID || '')
          .toString()
          .trim()
          .toUpperCase();

        billItems.push({
          description: `${instrument.display_name || symbol} - ${side}${isCarryForward ? ' (CF)' : ''}`,
          quantity: actualQuantity,
          rate: price,
          amount,
          client_code: clientId,
          instrument_id: instrument.id,
          brokerage_rate_pct: brokerageRate,
          brokerage_amount: brokerageAmount,
          trade_type: type,
          broker_code: brokerCodeFromTrade || null,
          side: side,
        });
      }

      // Calculate net trade settlement (including CF trades in buy/sell amounts)
      // CF trades contribute to buy/sell amounts but not to brokerage
      let totalCFBuyAmount = 0;
      let totalCFSellAmount = 0;
      
      // Process CF trades separately to track amounts
      for (const trade of clientTrades) {
        const side = (trade.Side || trade.side || '').toString().toUpperCase();
        const type = (trade.Type || trade.type || 'T').toString().toUpperCase();
        const isCarryForward = type === 'CF';
        
        if (isCarryForward) {
          let lotQuantity = 0;
          if (side === 'BUY') {
            lotQuantity = Number(trade.BuyQty || trade.Quantity || trade.quantity || 0);
          } else if (side === 'SELL') {
            lotQuantity = Number(trade.SellQty || trade.Quantity || trade.quantity || 0);
          }
          
          let price = 0;
          if (side === 'BUY') {
            price = Number(trade.BuyAvg || trade.Price || trade.price || 0);
          } else if (side === 'SELL') {
            price = Number(trade.SellAvg || trade.Price || trade.price || 0);
          }
          
          // Use lot size 1 as default for CF amount calculation
          const cfAmount = lotQuantity * price;
          
          if (side === 'BUY') {
            totalCFBuyAmount += cfAmount;
          } else if (side === 'SELL') {
            totalCFSellAmount += cfAmount;
          }
        }
      }
      
      // For F&O: BUY = client owes us money (positive), SELL = we owe client money (negative)
      // Net = Money client owes us - Money we owe client
      const netTradeAmount = (totalBuyAmount + totalCFBuyAmount) - (totalSellAmount + totalCFSellAmount);
      const finalClientBalance = netTradeAmount + totalBrokerage;

      if (Math.abs(finalClientBalance) < 0.01 && billItems.length === 0) {
        console.log(`Skipping F&O client bill for ${party.party_code} due to zero total and no items`);
        continue;
      }

      // Get current client balance
      let currentClientBalance = 0;
      const clientBalanceQuery = await client.query(
        'SELECT balance FROM fo_ledger_entries WHERE party_id = $1 AND reference_type = $2 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        [party.id, 'client_settlement']
      );
      if (clientBalanceQuery.rows.length > 0) {
        currentClientBalance = Number(clientBalanceQuery.rows[0].balance) || 0;
      }
      
      const newClientBalance = currentClientBalance + finalClientBalance;

      // Create new F&O bill
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      const billNumber = `PTY${y}${m}${d}-${suffix}`;

      const billResult = await client.query(
        'INSERT INTO fo_bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [billNumber, party.id, billDateStr, finalClientBalance, 'party', 'pending']
      );

      const billId = billResult.rows[0].id;

      // Create ledger entry
      // For party ledger: Debit = party owes you (positive balance), Credit = you owe party (negative balance)
      const debitAmount = finalClientBalance > 0 ? finalClientBalance : 0;
      const creditAmount = finalClientBalance < 0 ? Math.abs(finalClientBalance) : 0;
      
      // Build particulars with CF label if applicable
      let particularsText = `F&O Bill ${billNumber}`;
      let referenceType = 'client_settlement';
      
      // Check if this bill contains any CF trades
      const hasCFTrades = totalCFBuyAmount > 0 || totalCFSellAmount > 0;
      
        if (hasCFTrades && totalBuyAmount === 0 && totalSellAmount === 0) {
        // Only CF trades in this bill - mark as carry_forward_adjustment
        referenceType = 'carry_forward_adjustment';
        if (totalCFSellAmount > 0) {
          particularsText += ` - CF SELL Adjustment: ?${totalCFSellAmount.toFixed(2)} (Position Carry)`;
        } else if (totalCFBuyAmount > 0) {
          particularsText += ` - CF BUY Adjustment: ?${totalCFBuyAmount.toFixed(2)} (Position Carry)`;
        }
      } else {
        // Mixed or normal trades
        particularsText += ` - Buy: ?${(totalBuyAmount + totalCFBuyAmount).toFixed(2)}, Sell: ?${(totalSellAmount + totalCFSellAmount).toFixed(2)}, Brokerage: ?${totalBrokerage.toFixed(2)}`;
        if (hasCFTrades) {
          particularsText += ` (includes CF)`;
        }
      }
      particularsText += ` (${clientTrades.length} trades)`;
      
      const consolidatedLedgerResult = await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          party.id,
          billDateStr,
          particularsText,
          debitAmount,
          creditAmount,
          newClientBalance,
          referenceType,
          billId
        ]
      );
      results.ledgerEntries.push(consolidatedLedgerResult.rows[0]);

      // For each non-CF bill item, group by its broker_code (per TRADE, not per client)
      const nonCFItems = billItems.filter(item => item.trade_type !== 'CF');
      for (const item of nonCFItems) {
        const itemBrokerCode = (item.broker_code || 'BROKER').toString().trim().toUpperCase();

        // Look up broker slabs for this broker code (if available)
        let brokerRateTrading = 0;
        let brokerRateDelivery = 0;
        const brokerQuery = await client.query(
          'SELECT trading_slab, delivery_slab FROM broker_master WHERE UPPER(broker_code) = $1',
          [itemBrokerCode]
        );
        if (brokerQuery.rows.length > 0) {
          brokerRateTrading = Number(brokerQuery.rows[0].trading_slab) || 0;
          brokerRateDelivery = Number(brokerQuery.rows[0].delivery_slab) || 0;
        }

        // Calculate broker's share for this item using THIS broker's slabs
        const brokerRate = item.trade_type === 'T' ? brokerRateTrading : brokerRateDelivery;
        const brokerShare = (item.amount * brokerRate) / 100;
        item.broker_share = brokerShare;
        
        // Add this item into that broker's group
        const key = itemBrokerCode;
        if (!foBrokerGroups[key]) {
          foBrokerGroups[key] = {
            items: [],
            // NOTE: For equity broker bills we want this to mean TOTAL CLIENT BROKERAGE
            // (what client paid us). For F&O we keep same naming but semantics are similar.
            totalBrokerageAllClients: 0,
          };
        }
        foBrokerGroups[key].items.push(item);
        // Accumulate CLIENT brokerage (bill_items.brokerage_amount), not main broker share
        foBrokerGroups[key].totalBrokerageAllClients += (item.brokerage_amount || 0);
      }

      // Insert F&O bill items
      for (const item of billItems) {
        await client.query(
          'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type, side) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [
            billId,
            item.description,
            item.quantity,
            item.rate,
            item.amount,
            item.client_code,
            item.instrument_id,
            item.brokerage_rate_pct,
            item.brokerage_amount,
            item.trade_type,
            item.side || null,
          ]
        );
      }

      results.clientBills.push({
        billId,
        billNumber,
        clientId,
        partyName: party.name,
        totalBuyAmount,
        totalSellAmount,
        totalBrokerage,
        netAmount: finalClientBalance,
        items: billItems.length,
      });
    }

    // Create broker bill(s) per broker code (matches Equity structure)
    for (const [brokerCode, group] of Object.entries(foBrokerGroups)) {
      const allBrokerBillItems = group.items;
      const totalBrokerageAllClients = group.totalBrokerageAllClients;
      if (!allBrokerBillItems.length) continue;

      // Get broker details to calculate main broker brokerage
      const brokerQuery = await client.query(
        'SELECT id, broker_code, name, trading_slab, delivery_slab FROM broker_master WHERE UPPER(broker_code) = $1',
        [brokerCode]
      );
      
      let mainBrokerBillTotal = 0; // Net trade settlement minus broker brokerage
      let mainBrokerBrokerage = 0;
      let netTradeAmount = 0;
      let subBrokerProfit = 0;
      let brokerId = null;
      
      let brokerTradingSlab = 0;
      let brokerDeliverySlab = 0;
      if (brokerQuery.rows.length > 0) {
        const broker = brokerQuery.rows[0];
        brokerId = broker.id;
        brokerTradingSlab = Number(broker.trading_slab) || 0;
        brokerDeliverySlab = Number(broker.delivery_slab) || 0;
      }
      
      // Calculate net trade amount and broker brokerage for THIS broker
      let totalBuyAcrossClients = 0;
      let totalSellAcrossClients = 0;
      let totalTradingAmount = 0;
      let totalDeliveryAmount = 0;
      
      for (const item of allBrokerBillItems) {
        const itemAmount = Number(item.amount) || 0;
        // Use side column if available, otherwise fall back to description parsing
        const itemSide = (item.side || (item.description && item.description.toUpperCase().includes('BUY') ? 'BUY' : 'SELL'))
          .toString()
          .trim()
          .toUpperCase();
        if (itemSide === 'BUY') {
          totalBuyAcrossClients += itemAmount;
        } else if (itemSide === 'SELL') {
          totalSellAcrossClients += itemAmount;
        }
        
        if (item.trade_type === 'T') {
          totalTradingAmount += itemAmount;
        } else if (item.trade_type === 'D') {
          totalDeliveryAmount += itemAmount;
        }
      }
      
      // For F&O: BUY = client owes us money (positive), SELL = we owe client money (negative)
      // Net = Money client owes us - Money we owe client
      netTradeAmount = totalBuyAcrossClients - totalSellAcrossClients;
      
    // Broker slab rates are stored as percentages (e.g., 2 for 2%), need to divide by 100
      // Calculate main broker's brokerage share only (not including trade settlement)
      const mainBrokerTradingBrokerage = totalTradingAmount * (brokerTradingSlab / 100);
      const mainBrokerDeliveryBrokerage = totalDeliveryAmount * (brokerDeliverySlab / 100);
      mainBrokerBrokerage = mainBrokerTradingBrokerage + mainBrokerDeliveryBrokerage;
      
      // Main broker bill: trade settlement (absolute) minus main broker brokerage.
      // Example: Net Trade 200000, Brokerage 40 => bill total 199960.
      const netTradeAbs = Math.abs(netTradeAmount);
      mainBrokerBillTotal = netTradeAbs - mainBrokerBrokerage;
      
      // Sub-broker profit = Total brokerage collected from clients - Main broker's brokerage share
      subBrokerProfit = totalBrokerageAllClients - mainBrokerBrokerage;
      
      // If there is absolutely no brokerage and no trade value for this broker,
      // skip creating broker bill and ledger entries to avoid 0.00 main/sub rows.
      if (
        Math.abs(mainBrokerBrokerage) < 0.005 &&
        Math.abs(totalBrokerageAllClients) < 0.005 &&
        Math.abs(netTradeAmount) < 0.005
      ) {
        continue;
      }
      
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const brokerBillNumber = `BRK${y}${m}${d}-${Math.floor(Math.random() * 900) + 100}`;
      
    const brokerBillResult = await client.query(
        'INSERT INTO fo_bills (bill_number, party_id, broker_id, broker_code, bill_date, total_amount, bill_type, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          brokerBillNumber,
          null,
          brokerId,
          brokerCode,
          billDateStr,
          mainBrokerBillTotal,
          'broker',
          'pending',
          `Main Broker Bill - Net Trade: ₹${Math.abs(netTradeAmount).toFixed(2)} + Brokerage: ₹${mainBrokerBrokerage.toFixed(2)}`
        ]
      );
      const brokerBillId = brokerBillResult.rows[0].id;
      
      // NOTE: Contract linking is done when contracts are manually created
      // CSV upload doesn't create contracts, so no linking needed here
      
      // Insert broker bill items for THIS broker
      for (const item of allBrokerBillItems) {
        await client.query(
          'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type, side) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [
            brokerBillId,
            item.description,
            item.quantity,
            item.rate,
            item.amount,
            item.client_code,
            item.instrument_id,
            item.brokerage_rate_pct,
            item.brokerage_amount,
            item.trade_type,
            item.side || null
          ]
        );
      }

      // Check if broker bill has any normal (non-CF) trades
      // If broker bill ONLY has trades from CF SELL clients, show only brokerage
      // If broker bill has normal trades, show full amount
      const hasNormalTrades = allBrokerBillItems.length > 0; // Non-CF items exist
      
      // Create sub-broker profit ledger entry (show before main broker row)
      let subBrokerProfitBalance = 0;
      const profitBalanceQuery = await client.query(
        'SELECT balance FROM fo_ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['sub_broker_profit']
      );
      if (profitBalanceQuery.rows.length > 0) {
        subBrokerProfitBalance = Number(profitBalanceQuery.rows[0].balance) || 0;
      }
      subBrokerProfitBalance += subBrokerProfit;
      
      const profitLedgerResult = await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Sub-Broker Profit - Bill ${brokerBillNumber} - Sub-broker: ₹${totalBrokerageAllClients.toFixed(2)}, Main Broker: ₹${mainBrokerBrokerage.toFixed(2)}, Profit: ₹${subBrokerProfit.toFixed(2)}`,
          0,
          subBrokerProfit,
          subBrokerProfitBalance,
          'sub_broker_profit',
          brokerBillId
        ]
      );
      results.brokerEntries.push(profitLedgerResult.rows[0]);

      // Create main broker ledger entry
      let brokerBrokerageBalance = 0;
      const brokerageBalanceQuery = await client.query(
        'SELECT balance FROM fo_ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['broker_brokerage']
      );
      if (brokerageBalanceQuery.rows.length > 0) {
        brokerBrokerageBalance = Number(brokerageBalanceQuery.rows[0].balance) || 0;
      }
      // For main broker, keep negative balance for amounts payable
      brokerBrokerageBalance -= mainBrokerBillTotal;
      
      const brokerageEntryResult = await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Main Broker Bill ${brokerBillNumber} - Net Trade: ₹${Math.abs(netTradeAmount).toFixed(2)} + Brokerage: ₹${mainBrokerBrokerage.toFixed(2)}`,
          mainBrokerBillTotal,     // Debit
          0,                      // No credit
          brokerBrokerageBalance,
          'broker_brokerage',
          brokerBillId
        ]
      );
      results.brokerEntries.push(brokerageEntryResult.rows[0]);
    }

    await client.query('COMMIT');
    res.json({ success: true, bills: createdBills });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating FO bills from contracts:', error);
    res.status(500).json({ error: 'Failed to generate FO bills', details: error.message });
  } finally {
    client.release();
  }
});

// Helper function to generate broker bills and sub-broker profit entries
async function generateFOBrokerBills(client, contracts, billDateStr) {
  const results = {
    brokerBills: [],
    brokerEntries: []
  };
  
  try {
    // Group contracts by broker
    const brokerGroups = new Map();
    for (const contract of contracts) {
      if (!contract.broker_id) continue;
      const brokerId = String(contract.broker_id);
      if (!brokerGroups.has(brokerId)) {
        brokerGroups.set(brokerId, []);
      }
      brokerGroups.get(brokerId).push(contract);
    }
    
    // Process each broker group
    for (const [brokerId, brokerContracts] of brokerGroups.entries()) {
      // Calculate total brokerage collected from all clients for this broker
      let totalBrokerageAllClients = 0;
      const allBrokerBillItems = [];
      
      for (const contract of brokerContracts) {
        totalBrokerageAllClients += Number(contract.brokerage_amount || 0);
        
        // Get instrument details for bill items
        if (contract.instrument_id) {
          try {
            const instrumentResult = await client.query(
              'SELECT * FROM fo_instrument_master WHERE id = $1',
              [contract.instrument_id]
            );
            const instrument = instrumentResult.rows[0];
            
            allBrokerBillItems.push({
              description: `${instrument?.display_name || contract.instrument_id} - ${(contract.side || '').toString().trim().toUpperCase() || contract.trade_type || 'T'}`,
              quantity: contract.quantity,
              rate: contract.price,
              amount: contract.amount,
              client_code: contract.party_code,
              instrument_id: contract.instrument_id,
              brokerage_rate_pct: contract.brokerage_rate,
              brokerage_amount: contract.brokerage_amount,
              trade_type: contract.trade_type || 'T',
              side: (contract.side || '').toString().trim().toUpperCase() || null,
            });
          } catch (error) {
            console.warn('Could not fetch instrument details for contract:', contract.id);
          }
        }
      }
      
      // Skip only if no meaningful brokerage AND no meaningful trade value
      // (we still want broker bills for trade settlement even if brokerage is zero)
      if (Math.abs(totalBrokerageAllClients) < 0.01 && allBrokerBillItems.length === 0) {
        continue;
      }
      
      // Get broker details
      const brokerResult = await client.query(
        'SELECT * FROM broker_master WHERE id = $1',
        [brokerId]
      );
      const broker = brokerResult.rows[0];
      const brokerCode = broker?.broker_code || 'BRK';
      
      // Calculate main broker's share using broker's own slab rates (same as frontend)
      // Broker slab rates are stored as percentages (e.g., 2 for 2%), need to divide by 100
      const tradingRate = broker ? Number(broker.trading_slab || 0) : 0;
      const deliveryRate = broker ? Number(broker.delivery_slab || 0) : 0;
      
      // Calculate net trade and main broker brokerage share
      let totalBuyAcrossClients = 0;
      let totalSellAcrossClients = 0;
      let mainBrokerBrokerage = 0;

      for (const item of allBrokerBillItems) {
        const amountAbs = Math.abs(Number(item.amount || 0));
        const isTrading = (item.trade_type || "T").toUpperCase() === "T";
        const rate = isTrading ? tradingRate : deliveryRate;
        const brokerShare = (amountAbs * rate) / 100;
        mainBrokerBrokerage += brokerShare;

        const side = (item.side || '').toString().trim().toUpperCase();
        if (side === 'BUY') {
          totalBuyAcrossClients += amountAbs;
        } else if (side === 'SELL') {
          totalSellAcrossClients += amountAbs;
        }
      }

      const netTradeAmount = totalBuyAcrossClients - totalSellAcrossClients;
      const netTradeAbs = Math.abs(netTradeAmount);
      const mainBrokerBillTotal = netTradeAbs - mainBrokerBrokerage;

      const subBrokerProfit = totalBrokerageAllClients - mainBrokerBrokerage;
      // Skip if no meaningful amounts
      if (
        Math.abs(mainBrokerBillTotal) < 0.01 &&
        Math.abs(subBrokerProfit) < 0.01
      ) {
        continue;
      }
      
      // Generate broker bill number
      const now = new Date(billDateStr);
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const brokerBillNumber = `BRK${y}${m}${d}-${Math.floor(Math.random() * 900) + 100}`;
      
      // Create broker bill
      const brokerBillResult = await client.query(
        'INSERT INTO fo_bills (bill_number, party_id, broker_id, broker_code, bill_date, total_amount, bill_type, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          brokerBillNumber,
          null, // No party for broker bills
          brokerId,
          brokerCode,
          billDateStr,
          mainBrokerBillTotal,
          'broker',
          'pending',
          `Main Broker Bill - Net Trade: ₹${netTradeAbs.toFixed(2)} + Brokerage: ₹${mainBrokerBrokerage.toFixed(2)}`
        ]
      );
      const brokerBillId = brokerBillResult.rows[0].id;
      results.brokerBills.push(brokerBillResult.rows[0]);
      
      // Insert broker bill items
      for (const item of allBrokerBillItems) {
        await client.query(
          'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type, side) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [
            brokerBillId,
            item.description,
            item.quantity,
            item.rate,
            item.amount,
            item.client_code,
            item.instrument_id,
            item.brokerage_rate_pct,
            item.brokerage_amount,
            item.trade_type,
            item.side || null
          ]
        );
      }
      
      // Create sub-broker profit ledger entry (show before main broker row)
      let subBrokerProfitBalance = 0;
      const profitBalanceQuery = await client.query(
        'SELECT balance FROM fo_ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['sub_broker_profit']
      );
      if (profitBalanceQuery.rows.length > 0) {
        subBrokerProfitBalance = Number(profitBalanceQuery.rows[0].balance) || 0;
      }
      subBrokerProfitBalance += subBrokerProfit;
      
      const profitLedgerResult = await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Sub-Broker Profit - Bill ${brokerBillNumber} - Sub-broker: ₹${totalBrokerageAllClients.toFixed(2)}, Main Broker: ₹${mainBrokerBrokerage.toFixed(2)}, Profit: ₹${subBrokerProfit.toFixed(2)}`,
          0,
          subBrokerProfit,
          subBrokerProfitBalance,
          'sub_broker_profit',
          brokerBillId
        ]
      );
      results.brokerEntries.push(profitLedgerResult.rows[0]);

      // Create main broker ledger entry
      let brokerBrokerageBalance = 0;
      const brokerageBalanceQuery = await client.query(
        'SELECT balance FROM fo_ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['broker_brokerage']
      );
      if (brokerageBalanceQuery.rows.length > 0) {
        brokerBrokerageBalance = Number(brokerageBalanceQuery.rows[0].balance) || 0;
      }
      // Negative balance for amounts payable to main broker
      brokerBrokerageBalance -= mainBrokerBillTotal;
      
      const brokerageEntryResult = await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Main Broker Bill ${brokerBillNumber} - Net Trade: ₹${netTradeAbs.toFixed(2)} + Brokerage: ₹${mainBrokerBrokerage.toFixed(2)}`,
          mainBrokerBillTotal,
          0,
          brokerBrokerageBalance,
          'broker_brokerage',
          brokerBillId
        ]
      );
      results.brokerEntries.push(brokerageEntryResult.rows[0]);
    }
    
    return results;
  } catch (error) {
    console.error('Error generating FO broker bills:', error);
    throw error;
  }
}

// ========================================
// NOTE: F&O uses Equity party_master and broker_master (shared)
// Use /api/parties and /api/brokers endpoints for both modules
// ========================================

// ========================================
// F&O CONTRACTS APIs
// ========================================

// Get all F&O contracts
app.get('/api/fo/contracts', async (req, res) => {
  try {
    const { party_id, instrument_id } = req.query;
    
    let query = `
      SELECT c.*, 
             p.party_code, p.name as party_name,
             i.symbol, i.instrument_type, i.expiry_date, i.strike_price, i.display_name,
             b.broker_code, bm.name as broker_name
      FROM fo_contracts c
      LEFT JOIN party_master p ON p.id = c.party_id
      LEFT JOIN fo_instrument_master i ON i.id = c.instrument_id
      LEFT JOIN broker_master bm ON bm.id = c.broker_id
      LEFT JOIN broker_master b ON b.id = c.broker_id
      WHERE 1=1
    `;
    const params = [];
    
    if (party_id) {
      params.push(party_id);
      query += ` AND c.party_id = $${params.length}`;
    }
    
    if (instrument_id) {
      params.push(instrument_id);
      query += ` AND c.instrument_id = $${params.length}`;
    }
    
    query += ` ORDER BY c.trade_date DESC, c.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O contracts:', error);
    res.status(500).json({ error: 'Failed to fetch F&O contracts' });
  }
});

// Get single F&O contract
app.get('/api/fo/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, 
              p.party_code, p.name as party_name,
              i.symbol, i.instrument_type, i.expiry_date, i.strike_price, i.display_name,
              bm.broker_code, bm.name as broker_name
       FROM fo_contracts c
       LEFT JOIN party_master p ON p.id = c.party_id
       LEFT JOIN fo_instrument_master i ON i.id = c.instrument_id
       LEFT JOIN broker_master bm ON bm.id = c.broker_id
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching F&O contract:', error);
    res.status(500).json({ error: 'Failed to fetch F&O contract' });
  }
});

// Create F&O contract
app.post('/api/fo/contracts', async (req, res) => {
  try {
    const { 
      contract_number, party_id, instrument_id, broker_id, broker_code,
      trade_date, trade_type, quantity, price, amount,
      brokerage_rate, brokerage_amount, status, notes 
    } = req.body;
    
    // For CF (Carry Forward) trades, brokerage should be 0
    const finalBrokerageRate = trade_type === 'CF' ? 0 : brokerage_rate;
    const finalBrokerageAmount = trade_type === 'CF' ? 0 : brokerage_amount;
    
    const result = await pool.query(
      `INSERT INTO fo_contracts 
        (contract_number, party_id, instrument_id, broker_id, broker_code, trade_date, 
         trade_type, quantity, price, amount, brokerage_rate, brokerage_amount, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [
        contract_number, party_id, instrument_id, broker_id, broker_code,
        trade_date, trade_type, quantity, price, amount,
        finalBrokerageRate, finalBrokerageAmount, status || 'open', notes
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating F&O contract:', error);
    res.status(500).json({ error: 'Failed to create F&O contract' });
  }
});

// Update F&O contract
app.put('/api/fo/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      contract_number, party_id, instrument_id, broker_id, broker_code,
      trade_date, trade_type, quantity, price, amount,
      brokerage_rate, brokerage_amount, status, notes 
    } = req.body;
    
    // For CF (Carry Forward) trades, brokerage should be 0
    const finalBrokerageRate = trade_type === 'CF' ? 0 : brokerage_rate;
    const finalBrokerageAmount = trade_type === 'CF' ? 0 : brokerage_amount;
    
    const result = await pool.query(
      `UPDATE fo_contracts 
       SET contract_number = $1, party_id = $2, instrument_id = $3, broker_id = $4, 
           broker_code = $5, trade_date = $6, trade_type = $7, side = $8, quantity = $9, 
           price = $10, amount = $11, brokerage_rate = $12, brokerage_amount = $13, 
           status = $14, notes = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 
       RETURNING *`,
      [
        contract_number, party_id, instrument_id, broker_id, broker_code,
        trade_date, trade_type, trade_type === 'CF' ? 'BUY' : 'SELL', quantity, price, amount,
        finalBrokerageRate, finalBrokerageAmount, status, notes, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating F&O contract:', error);
    res.status(500).json({ error: 'Failed to update F&O contract' });
  }
});

// Delete F&O contract
app.delete('/api/fo/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fo_contracts WHERE id = $1', [id]);
    res.json({ message: 'F&O contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting F&O contract:', error);
    res.status(500).json({ error: 'Failed to delete F&O contract' });
  }
});

// Batch create F&O contracts with bills (only for BUY trades)
app.post('/api/fo/contracts/batch', async (req, res) => {
  const client = await pool.connect();
  try {
    const { contracts, billDate, generateBills } = req.body;
    
    if (!Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: 'contracts array is required' });
    }

    await client.query('BEGIN');

    const now = new Date();
    const billDateStr = billDate || now.toISOString().slice(0, 10);
    const createdContracts = [];
    const partyBills = [];
    const brokerBills = [];

    // Only generate bills if generateBills flag is true (for BUY trades)
    if (generateBills) {
      // Group contracts by party for bill generation
      const partyGroups = {};
      for (const contract of contracts) {
        if (!partyGroups[contract.party_id]) {
          partyGroups[contract.party_id] = [];
        }
        partyGroups[contract.party_id].push(contract);
      }

      // Process each party group
      for (const [partyId, partyContracts] of Object.entries(partyGroups)) {
        let totalBuyAmount = 0;
        let totalBrokerage = 0;
        const billItems = [];

        // Create contracts and collect bill items
        for (const contract of partyContracts) {
          // Determine side based on quantity sign
          const side = contract.quantity > 0 ? 'BUY' : 'SELL';
          
          // Create contract
          const contractResult = await client.query(
            `INSERT INTO fo_contracts 
              (party_id, instrument_id, broker_id, broker_code, trade_date, trade_type, 
               side, quantity, price, amount, brokerage_rate, brokerage_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
             RETURNING *`,
            [
              contract.party_id, contract.instrument_id, contract.broker_id, 
              contract.broker_code, contract.trade_date, contract.trade_type,
              side, contract.quantity, contract.price, contract.amount,
              contract.brokerage_rate, contract.brokerage_amount, 'open'
            ]
          );
          createdContracts.push(contractResult.rows[0]);

          totalBuyAmount += parseFloat(contract.amount);
          totalBrokerage += parseFloat(contract.brokerage_amount);

          // Get instrument details
          const instrumentResult = await client.query(
            'SELECT * FROM fo_instrument_master WHERE id = $1',
            [contract.instrument_id]
          );
          const instrument = instrumentResult.rows[0];

          // Use the side from the contract if available, otherwise determine based on quantity sign
          const displaySide = contract.side || (contract.quantity > 0 ? 'BUY' : 'SELL');
          
          
          billItems.push({
            contract_id: contractResult.rows[0].id,
            instrument_id: contract.instrument_id,
            description: `${instrument.display_name} - ${displaySide}`,
            quantity: contract.quantity, // Keep signed quantity to preserve BUY/SELL information
            rate: contract.price,
            amount: contract.amount,
            brokerage_rate_pct: contract.brokerage_rate,
            brokerage_amount: contract.brokerage_amount,
            trade_type: 'T',
            side: displaySide,
          });        }
        // Get party details
        const partyResult = await client.query(
          'SELECT * FROM party_master WHERE id = $1',
          [partyId]
        );
        const party = partyResult.rows[0];

        // Create party bill
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const suffix = String(Math.floor(Math.random() * 900) + 100);
        const billNumber = `PTY${y}${m}${d}-${suffix}`;

        const finalBillAmount = totalBuyAmount + totalBrokerage;

        const billResult = await client.query(
          `INSERT INTO fo_bills 
            (bill_number, party_id, bill_date, total_amount, brokerage_amount, bill_type, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [billNumber, partyId, billDateStr, finalBillAmount, totalBrokerage, 'party', 'pending']
        );
        partyBills.push(billResult.rows[0]);

        const billId = billResult.rows[0].id;

        // Insert bill items
        for (const item of billItems) {
          await client.query(
            `INSERT INTO fo_bill_items 
              (bill_id, contract_id, instrument_id, description, quantity, rate, amount, 
               brokerage_rate_pct, brokerage_amount, trade_type, side) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              billId, item.contract_id, item.instrument_id, item.description,
              item.quantity, item.rate, item.amount,
              item.brokerage_rate_pct, item.brokerage_amount, item.trade_type,
              item.side || null
            ]
          );
        }

        // Create ledger entry
        const currentBalance = await client.query(
          `SELECT balance FROM fo_ledger_entries 
           WHERE party_id = $1 
           ORDER BY entry_date DESC, created_at DESC 
           LIMIT 1`,
          [partyId]
        );
        const balance = currentBalance.rows.length > 0 
          ? parseFloat(currentBalance.rows[0].balance) 
          : 0;
        // For ledger entry, determine if this is a debit or credit based on net amount
        // Positive amount = debit (client owes money), negative amount = credit (client is owed money)
        const netAmount = partyContracts.reduce((sum, contract) => {
          const qty = Number(contract.quantity) || 0;
          const amt = Number(contract.amount) || 0;
          const brokerage = Number(contract.brokerage_amount) || 0;
          
          // For BUY trades: client pays (debit)
          // For SELL trades: client receives (credit)
          const isBuy = qty > 0;
          const tradeAmount = isBuy ? amt : -amt;
          
          return sum + tradeAmount + brokerage; // Brokerage is always a cost (debit)
        }, 0);
        
        const newBalance = balance + netAmount;

        await client.query(
          `INSERT INTO fo_ledger_entries 
            (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            partyId, billDateStr,
            `F&O Bill ${billNumber} - trades`,
            Math.max(0, netAmount), Math.max(0, -netAmount), newBalance, 'client_settlement', billId
          ]
        );
      }

      // Create broker bill if there are contracts
      if (contracts.length > 0 && contracts[0].broker_id) {
        const brokerId = contracts[0].broker_id;
        const totalBrokerBrokerage = contracts.reduce(
          (sum, c) => sum + parseFloat(c.brokerage_amount), 0
        );

        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const brokerBillNumber = `BRK${y}${m}${d}-${Math.floor(Math.random() * 900) + 100}`;

        const brokerBillResult = await client.query(
          `INSERT INTO fo_bills 
            (bill_number, broker_id, bill_date, total_amount, brokerage_amount, bill_type, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [brokerBillNumber, brokerId, billDateStr, totalBrokerBrokerage, totalBrokerBrokerage, 'broker', 'pending']
        );
        brokerBills.push(brokerBillResult.rows[0]);
        
        // Create broker ledger entry
        let brokerBalance = 0;
        const brokerBalanceQuery = await client.query(
          'SELECT balance FROM fo_ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
          ['broker_brokerage']
        );
        if (brokerBalanceQuery.rows.length > 0) {
          brokerBalance = Number(brokerBalanceQuery.rows[0].balance) || 0;
        }
        brokerBalance += totalBrokerBrokerage;
        
        await client.query(
          'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [
            null,
            billDateStr,
            `Broker Bill ${brokerBillNumber} - Brokerage: ₹${totalBrokerBrokerage.toFixed(2)}`,
            totalBrokerBrokerage,  // Debit - money owed to broker
            0,                     // No credit
            brokerBalance,
            'broker_brokerage',
            brokerBillResult.rows[0].id
          ]
        );
      }
    } else {
      // Just create contracts without bills
      for (const contract of contracts) {
        // Determine side based on quantity sign
        const side = contract.quantity > 0 ? 'BUY' : 'SELL';
        
        const contractResult = await client.query(
          `INSERT INTO fo_contracts 
            (party_id, instrument_id, broker_id, broker_code, trade_date, trade_type, 
             side, quantity, price, amount, brokerage_rate, brokerage_amount, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
           RETURNING *`,
          [
            contract.party_id, contract.instrument_id, contract.broker_id, 
            contract.broker_code, contract.trade_date, contract.trade_type,
            side, contract.quantity, contract.price, contract.amount,
            contract.brokerage_rate, contract.brokerage_amount, 'open'
          ]
        );
        createdContracts.push(contractResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.json({ contracts: createdContracts, partyBills, brokerBills });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating F&O contracts batch:', error);
    res.status(500).json({ error: 'Failed to create F&O contracts batch', details: error.message });
  } finally {
    client.release();
  }
});

// ========================================
// F&O BILLING FROM CONTRACTS (manual run)
// ========================================

// Generate FO party bills (and basic ledger) from fo_contracts
app.post('/api/fo/billing/generate', async (req, res) => {
  const client = await pool.connect();
  try {
    const { fromDate, toDate, billDate, partyId } = req.body || {};

    if (!fromDate || !toDate) {
      return res.status(400).json({
        error: 'fromDate and toDate are required',
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      return res.status(400).json({ error: 'fromDate/toDate must be YYYY-MM-DD' });
    }

    const now = new Date();
    let billDateStr = now.toISOString().slice(0, 10);
    if (typeof billDate === 'string' && dateRegex.test(billDate.trim())) {
      billDateStr = billDate.trim();
    }

    await client.query('BEGIN');

    // Build base contracts query
    // Convert dates to handle timezone differences (contracts stored in UTC, search in local time)
    let contractsSql = `
      SELECT c.*, p.party_code
      FROM fo_contracts c
      LEFT JOIN party_master p ON p.id = c.party_id
      WHERE c.trade_date::date >= $1::date AND c.trade_date::date <= $2::date
    `;
    const params = [fromDate, toDate];

    if (partyId) {
      contractsSql += ' AND c.party_id = $3';
      params.push(partyId);
    }

    const contractsRes = await client.query(contractsSql, params);
    const contracts = contractsRes.rows || [];

    if (!contracts.length) {
      await client.query('ROLLBACK');
      return res.json({ success: true, message: 'No FO contracts found for given range', bills: [] });
    }

    // Group contracts by party
    const partyGroups = new Map();
    for (const c of contracts) {
      if (!c.party_id) continue;
      const key = String(c.party_id);
      if (!partyGroups.has(key)) partyGroups.set(key, []);
      partyGroups.get(key).push(c);
    }

    const createdBills = [];
    const billedContractIds = [];

    for (const [partyIdKey, partyContracts] of partyGroups.entries()) {
      // Party IDs are UUIDs, not numbers, so we shouldn't convert them
      const partyId = partyIdKey;
      if (!partyId) continue;

      // Compute totals from contracts
      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      let totalBrokerage = 0;

      for (const c of partyContracts) {
        const qty = Number(c.quantity) || 0;
        const rate = Number(c.price) || 0;
        const amt = Math.abs(Number(c.amount) || (Math.abs(qty) * rate));

        // IMPORTANT: use contract.side (BUY/SELL). c.trade_type is T/D/CF and should not be used as side.
        const side = (c.side || '').toString().trim().toUpperCase();

        // Store SELL as negative so that:
        // finalClientBalance = BUY - SELL + BROKERAGE
        if (side === 'BUY' || (!side && qty > 0)) {
          totalBuyAmount += amt;
        } else if (side === 'SELL' || (!side && qty < 0)) {
          totalSellAmount -= amt; // negative = money we give to client
        }

        // Brokerage is always a charge collected from client (positive)
        totalBrokerage += Math.abs(Number(c.brokerage_amount || 0));
      }

      // Net settlement for client:
      //  +ve => client owes us
      //  -ve => we owe client
      const finalClientBalance = totalSellAmount + totalBuyAmount + totalBrokerage;
      if (Math.abs(finalClientBalance) < 0.01) {
        continue; // nothing to bill
      }

      // Generate PTY bill number using selected bill date
      const [yy, mm, dd] = billDateStr.split('-');
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      const billNumber = `PTY${yy}${mm}${dd}-${suffix}`;

      const billInsert = await client.query(
        'INSERT INTO fo_bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [billNumber, partyId, billDateStr, finalClientBalance, 'party', 'pending']
      );
      const bill = billInsert.rows[0];

      // Insert bill items from contracts (one per contract)
      for (const c of partyContracts) {
        const qty = Math.abs(Number(c.quantity) || 0);
        const rate = Number(c.price) || 0;
        const amt = qty * rate;

        await client.query(
          'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type, side) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [
            bill.id,
            c.contract_number || c.notes || 'FO Contract',
            qty,
            rate,
            amt,
            c.client_code || c.party_code || null,
            c.instrument_id,
            Number(c.brokerage_rate || 0),
            Number(c.brokerage_amount || 0),
            (c.trade_type || '').toString().toUpperCase(),
            c.side || null
          ]
        );
      }

      // FO client ledger entry
      let currentBalance = 0;
      const balRes = await client.query(
        'SELECT balance FROM fo_ledger_entries WHERE party_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        [partyId]
      );
      if (balRes.rows.length > 0) {
        currentBalance = Number(balRes.rows[0].balance) || 0;
      }
      const newBalance = currentBalance + finalClientBalance;

      const debitAmount = finalClientBalance > 0 ? finalClientBalance : 0;
      const creditAmount = finalClientBalance < 0 ? Math.abs(finalClientBalance) : 0;

      await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          partyId,
          billDateStr,
          `Bill ${billNumber} - Buy: ₹${totalBuyAmount.toFixed(2)}, Sell: ₹${Math.abs(totalSellAmount).toFixed(2)}, Brokerage: ₹${totalBrokerage.toFixed(2)} (${partyContracts.length} trades)`,
          debitAmount,
          creditAmount,
          newBalance,
          'client_settlement',
          bill.id,
        ]
      );

      createdBills.push({
        billId: bill.id,
        billNumber,
        partyId: partyId,
        totalBuyAmount,
        totalSellAmount,
        totalBrokerage,
        netAmount: finalClientBalance,
        contracts: partyContracts.length,
      });

      // Mark these contracts as billed so we can remove them after successful generation.
      for (const c of partyContracts) {
        if (c && c.id !== undefined && c.id !== null) {
          billedContractIds.push(Number(c.id));
        }
      }
    }

    // Generate broker bills and sub-broker profit entries ONLY from billed contracts
    const billedContracts = contracts.filter(c => billedContractIds.includes(Number(c.id)));
    const brokerResults = await generateFOBrokerBills(client, billedContracts, billDateStr);

    // Delete billed contracts so they don't appear again.
    // If a party bill was not created, its contracts remain.
    if (billedContractIds.length > 0) {
      await client.query(
        'DELETE FROM fo_contracts WHERE id = ANY($1::int[])',
        [billedContractIds]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      bills: createdBills,
      brokerResults,
      deletedContracts: billedContractIds.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating FO bills from contracts:', error);
    res.status(500).json({ error: 'Failed to generate FO bills', details: error.message });
  } finally {
    client.release();
  }
});

// ========================================
// F&O DASHBOARD APIs
// ========================================

// Get F&O dashboard statistics
app.get('/api/fo/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(DISTINCT party_id) FROM fo_bills WHERE bill_type = 'party' AND party_id IS NOT NULL) as active_clients,
        (SELECT COALESCE(SUM(ABS(total_amount)), 0) FROM fo_bills WHERE bill_type = 'party') as total_billed,
        (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM fo_bills WHERE bill_type = 'party' AND status != 'paid' AND (total_amount - paid_amount) > 0) as pending_receivables,
        (SELECT COUNT(*) FROM fo_bills WHERE bill_type = 'party' AND status = 'pending') as pending_bills_count,
        (SELECT COUNT(*) FROM fo_positions WHERE status = 'open') as open_positions,
        (SELECT COALESCE(SUM(credit_amount), 0) 
         FROM fo_ledger_entries 
         WHERE party_id IS NULL 
         AND reference_type = 'sub_broker_profit' 
         AND entry_date = CURRENT_DATE) as today_brokerage
    `);
    res.json(stats.rows[0] || {});
  } catch (error) {
    console.error('Error fetching F&O dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch F&O dashboard stats' });
  }
});

// Get recent F&O contracts for dashboard
app.get('/api/fo/dashboard/recent-contracts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.contract_number,
        c.trade_date,
        c.trade_type,
        c.quantity,
        c.amount,
        c.brokerage_amount,
        c.party_id,
        p.party_code,
        p.name as party_name,
        i.display_name as instrument_name,
        i.symbol
      FROM fo_contracts c
      LEFT JOIN party_master p ON c.party_id = p.id
      LEFT JOIN fo_instrument_master i ON c.instrument_id = i.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching recent contracts:', error);
    res.status(500).json({ error: 'Failed to fetch recent contracts' });
  }
});

// Get FO sub-broker profit (total earnings)
app.get('/api/fo/ledger/sub-broker-profit', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(credit_amount), 0) as total_profit,
        COALESCE(MAX(balance), 0) as current_balance,
        COUNT(*) as transaction_count
       FROM fo_ledger_entries 
       WHERE party_id IS NULL AND reference_type = $1`,
      ['sub_broker_profit']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching FO sub-broker profit:', error);
    res.status(500).json({ error: 'Failed to fetch FO sub-broker profit' });
  }
});

// Get F&O broker holdings summary (aggregated by broker across all clients)
app.get('/api/fo/positions/broker', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    // Build query with proper parameterization to prevent SQL injection
    let query = `
      WITH broker_data AS (
        SELECT 
          b.broker_code,
          bi.instrument_id,
          bi.quantity,
          bi.rate,
          bi.amount,
          pm.id AS client_id,
          b.bill_date AS last_trade_date
        FROM fo_bill_items bi
        INNER JOIN fo_bills b ON bi.bill_id = b.id
        INNER JOIN party_master pm ON UPPER(pm.party_code) = UPPER(bi.client_code)
        WHERE b.bill_type = 'broker' AND b.broker_code IS NOT NULL
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (from_date) {
      query += ` AND b.bill_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    
    if (to_date) {
      query += ` AND b.bill_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    query += `
      ),
      broker_summary AS (
        SELECT 
          broker_code,
          instrument_id,
          SUM(quantity) AS total_quantity,
          AVG(rate) AS avg_price,
          SUM(amount) AS total_invested,
          COUNT(DISTINCT client_id) AS client_count,
          MAX(last_trade_date) AS last_trade_date
        FROM broker_data
        GROUP BY broker_code, instrument_id
      )
      SELECT 
        bs.broker_code,
        bm.name as broker_name,
        bs.instrument_id,
        im.symbol,
        im.display_name,
        im.instrument_type,
        im.expiry_date,
        im.strike_price,
        bs.total_quantity,
        bs.avg_price,
        bs.total_invested,
        bs.client_count,
        bs.last_trade_date
      FROM broker_summary bs
      LEFT JOIN broker_master bm ON bs.broker_code = bm.broker_code
      LEFT JOIN fo_instrument_master im ON bs.instrument_id = im.id
      WHERE ABS(bs.total_quantity) > 0.01
      ORDER BY bs.total_quantity DESC, bs.broker_code, im.symbol
    `;

    const result = await pool.query(query, params);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O broker holdings:', error);
    res.status(500).json({ error: 'Failed to fetch F&O broker holdings' });
  }
});

// Get F&O positions (holdings)
app.get('/api/fo/positions', async (req, res) => {
  try {
    const { party_id } = req.query;
    
    // Enrich open positions with last trade date and per-broker quantity breakdown from F&O BROKER bills
    let query = `
      WITH raw AS (
        SELECT 
          pm.id AS party_id,
          bi.instrument_id,
          b.broker_code,
          MAX(b.bill_date) AS last_trade_date,
          SUM(
            CASE 
              WHEN UPPER(bi.description) LIKE '%BUY%' THEN COALESCE(bi.quantity,0)
              WHEN UPPER(bi.description) LIKE '%SELL%' THEN -COALESCE(bi.quantity,0)
              -- Fallback: use quantity sign if description doesn't contain BUY/SELL
              WHEN COALESCE(bi.quantity,0) > 0 THEN COALESCE(bi.quantity,0)
              WHEN COALESCE(bi.quantity,0) < 0 THEN -COALESCE(bi.quantity,0)
              ELSE 0
            END
          ) AS broker_net_qty
        FROM fo_bill_items bi
        INNER JOIN fo_bills b ON bi.bill_id = b.id
        INNER JOIN party_master pm ON UPPER(pm.party_code) = UPPER(bi.client_code)
        WHERE b.bill_type = 'broker' AND b.broker_code IS NOT NULL
        GROUP BY pm.id, bi.instrument_id, b.broker_code
      ),
      tx AS (
        SELECT 
          party_id,
          instrument_id,
          MAX(last_trade_date) AS last_trade_date,
          STRING_AGG(DISTINCT broker_code, ', ') AS broker_codes,
          STRING_AGG(broker_code || ':' || broker_net_qty::text, ', ') AS broker_qty_breakdown
        FROM raw
        GROUP BY party_id, instrument_id
      )
      SELECT 
        p.*,
        i.symbol,
        i.instrument_type,
        i.expiry_date,
        i.strike_price,
        i.display_name,
        i.lot_size,
        pm.party_code,
        pm.name as party_name,
        tx.last_trade_date,
        tx.broker_codes,
        tx.broker_qty_breakdown
      FROM fo_positions p
      LEFT JOIN fo_instrument_master i ON i.id = p.instrument_id
      LEFT JOIN party_master pm ON pm.id = p.party_id
      LEFT JOIN tx ON tx.party_id = p.party_id AND tx.instrument_id = p.instrument_id
      WHERE (p.status = 'open' OR ABS(p.quantity) > 0.01)
    `;
    const params = [];
    
    if (party_id) {
      params.push(party_id);
      query += ` AND p.party_id = $${params.length}`;
    }
    
    query += ` ORDER BY p.last_updated DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O positions:', error);
    res.status(500).json({ error: 'Failed to fetch F&O positions' });
  }
});

// Get F&O transaction history (date-wise buy/sell movements)
app.get('/api/fo/positions/transactions', async (req, res) => {
  try {
    const { party_id, instrument_id, from_date, to_date } = req.query;
    
    let query = `
      SELECT 
        bi.id,
        bi.bill_id,
        b.bill_number,
        b.bill_date,
        b.party_id,
        p.party_code,
        p.name as party_name,
        bi.instrument_id,
        i.symbol,
        i.display_name,
        i.instrument_type,
        bi.description,
        bi.side,
        bi.quantity,
        bi.rate,
        bi.amount,
        bi.brokerage_amount,
        bi.trade_type,
        bi.created_at
      FROM fo_bill_items bi
      INNER JOIN fo_bills b ON bi.bill_id = b.id
      LEFT JOIN party_master p ON b.party_id = p.id
      LEFT JOIN fo_instrument_master i ON bi.instrument_id = i.id
      WHERE b.bill_type = 'party'
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (party_id) {
      query += ` AND b.party_id = $${paramIndex}`;
      params.push(party_id);
      paramIndex++;
    }
    
    if (instrument_id) {
      query += ` AND bi.instrument_id = $${paramIndex}`;
      params.push(instrument_id);
      paramIndex++;
    }
    
    if (from_date) {
      query += ` AND b.bill_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    
    if (to_date) {
      query += ` AND b.bill_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    query += ' ORDER BY b.bill_date ASC, bi.created_at ASC';
    
    const result = await pool.query(query, params);
    
    // Calculate running balance per instrument per party (quantity-based)
    const transactions = [];
    const balances = {}; // Key: "party_id:instrument_id"
    
    for (const row of result.rows) {
      const key = `${row.party_id}:${row.instrument_id}`;
      if (!balances[key]) {
        balances[key] = 0;
      }
      
      const quantity = Number(row.quantity) || 0;
      
      // Determine if BUY or SELL (prefer explicit side column, then description, then quantity sign)
      let isBuy = false;
      let isSell = false;

      const rowSide = (row.side || '').toString().trim().toUpperCase();
      if (rowSide === 'BUY') {
        isBuy = true;
      } else if (rowSide === 'SELL') {
        isSell = true;
      }

      if (!isBuy && !isSell && row.description) {
        const descUpper = row.description.toUpperCase();
        if (descUpper.includes(' - BUY')) {
          isBuy = true;
        } else if (descUpper.includes(' - SELL')) {
          isSell = true;
        }
      }

      // Fallback: determine from quantity sign if neither side nor description indicates BUY/SELL
      if (!isBuy && !isSell) {
        if (quantity > 0) {
          isBuy = true;
        } else if (quantity < 0) {
          isSell = true;
        }
      }
      
      // Update running balance: BUY increases quantity, SELL decreases quantity
      if (isBuy) {
        balances[key] += quantity;
      } else if (isSell) {
        balances[key] -= quantity;
      }

      // Determine display type based on detected buy/sell or trade_type
      let displayType = 'UNKNOWN';
      if (isBuy) {
        displayType = 'BUY';
      } else if (isSell) {
        displayType = 'SELL';
      } else if (row.trade_type === 'T') {
        displayType = 'TRADING';
      } else if (row.trade_type === 'D') {
        displayType = 'DELIVERY';
      } else if (row.trade_type === 'CF') {
        displayType = 'CARRY FORWARD';
      }
      
      transactions.push({
        id: row.id,
        bill_id: row.bill_id,
        bill_number: row.bill_number,
        bill_date: row.bill_date,
        party_id: row.party_id,
        party_code: row.party_code,
        party_name: row.party_name,
        instrument_id: row.instrument_id,
        symbol: row.symbol,
        display_name: row.display_name,
        instrument_type: row.instrument_type,
        description: row.description,
        type: displayType,
        quantity: quantity,
        rate: Number(row.rate) || 0,
        amount: Number(row.amount) || 0,
        brokerage_amount: Number(row.brokerage_amount) || 0,
        trade_type: row.trade_type,
        balance: balances[key], // Use quantity-based running balance
        created_at: row.created_at
      });
    }
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching F&O transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch F&O transaction history' });
  }
});

// ========================================
// INTEREST CALCULATION APIs
// ========================================

// Calculate interest for parties with negative balance
// GET /api/interest?from_date=2024-01-01&to_date=2024-01-31&party_id=uuid&module=fo (optional, module can be 'fo' or 'equity')
app.get('/api/interest', async (req, res) => {
  try {
    const { from_date, to_date, party_id, module } = req.query;
    
    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'from_date and to_date are required' });
    }
    
    // Determine which ledger table to use (default: fo_ledger_entries)
    const ledgerTable = module === 'equity' ? 'ledger_entries' : 'fo_ledger_entries';
    
    // Get all parties with interest_rate > 0
    let partyQuery = 'SELECT id, party_code, name, interest_rate FROM party_master WHERE interest_rate > 0';
    const params = [];
    
    if (party_id) {
      params.push(party_id);
      partyQuery += ` AND id = $${params.length}`;
    }
    
    const partiesResult = await pool.query(partyQuery, params);
    const parties = partiesResult.rows;
    
    if (parties.length === 0) {
      return res.json({ message: 'No parties with interest rate configured', data: [] });
    }
    
    const interestCalculations = [];
    console.log('Interest API debug:', { from_date, to_date, module, parties: parties.map(p => ({ id: p.id, code: p.party_code, rate: p.interest_rate })) });
    
    for (const party of parties) {
      console.log('Processing party for interest:', party.id, party.party_code, 'rate:', party.interest_rate);
      // Step 1: Get balance before the period starts
      const beforePeriodQuery = await pool.query(
        `SELECT balance FROM ${ledgerTable}
         WHERE party_id = $1 AND entry_date < $2
         ORDER BY entry_date DESC, created_at DESC LIMIT 1`,
        [party.id, from_date]
      );
      
      let openingBalance = 0;
      if (beforePeriodQuery.rows.length > 0) {
        openingBalance = Number(beforePeriodQuery.rows[0].balance) || 0;
      }
      
      // Step 2: Get all ledger entries during the period
      const ledgerQuery = await pool.query(
        `SELECT entry_date, debit_amount, credit_amount, balance, reference_type, particulars
         FROM ${ledgerTable}
         WHERE party_id = $1 
           AND entry_date >= $2 
           AND entry_date <= $3
         ORDER BY entry_date ASC,
                  CASE
                    WHEN reference_type = 'carry_forward_adjustment' AND particulars ILIKE '%CF SELL%' THEN 0
                    WHEN reference_type = 'carry_forward_adjustment' AND particulars ILIKE '%CF BUY%'  THEN 2
                    ELSE 1
                  END ASC,
                  created_at ASC`,
        [party.id, from_date, to_date]
      );
      
      const ledgerEntries = ledgerQuery.rows;
      
      // Step 3: Calculate daily closing balances for every day in period
      const startDate = new Date(from_date);
      const endDate = new Date(to_date);
      const dailyBalances = [];
      const dailyOwed = [];
      let totalOwedSum = 0;
      
      let currentBalance = openingBalance;
      let ledgerIndex = 0;
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Apply all entries on this date
        while (ledgerIndex < ledgerEntries.length) {
          const entryDate = new Date(ledgerEntries[ledgerIndex].entry_date).toISOString().split('T')[0];
          if (entryDate === dateStr) {
            // Update balance with this entry
            currentBalance = Number(ledgerEntries[ledgerIndex].balance) || 0;
            ledgerIndex++;
          } else if (entryDate > dateStr) {
            break; // Entry is in future
          } else {
            ledgerIndex++; // Should not happen if query is correct
          }
        }
        
        // Record closing balance for this day
        dailyBalances.push({
          date: dateStr,
          closing_balance: currentBalance
        });
        
        // In this system, a POSITIVE ledger balance means client owes you (UI shows it as negative).
        // So we treat positive balances as owed for interest.
        if (currentBalance > 0) {
          const owedAmount = Math.abs(currentBalance);
          dailyOwed.push({
            date: dateStr,
            owed_amount: owedAmount,
            closing_balance: currentBalance
          });
          totalOwedSum += owedAmount;
        } else {
          dailyOwed.push({
            date: dateStr,
            owed_amount: 0,
            closing_balance: currentBalance
          });
        }
      }
      
      // Step 4: Calculate number of days
      const totalDays = dailyBalances.length;
      
      if (totalDays === 0) {
        continue; // No days in period
      }
      
      // Step 5: Calculate Average Daily Owed Balance (ADB)
      const adb = totalOwedSum / totalDays;
      
      // Step 6: Apply interest rate as MONTHLY rate, pro-rated per day.
      // Example: 1.50% per month → per-day rate = 1.5 / 100 / 30.
      const interestRate = Number(party.interest_rate) || 0;
      const dailyRate = interestRate / 100 / 30;
      const totalInterest = totalOwedSum * dailyRate;
      
      // Include this party whenever there is at least one day with owed balance.
      const hasDebtDays = dailyOwed.some(d => d.owed_amount > 0);
      if (hasDebtDays) {
        const lastOwed = dailyOwed[dailyOwed.length - 1]?.owed_amount || 0;
        interestCalculations.push({
          party_id: party.id,
          party_code: party.party_code,
          party_name: party.name,
          interest_rate: party.interest_rate,
          total_days: totalDays,
          total_owed_sum: totalOwedSum,
          average_daily_owed_balance: adb,
          total_interest: totalInterest,
          principal_plus_interest: lastOwed + totalInterest,
          daily_breakdown: dailyOwed
        });
      }
    }
    
    res.json({
      from_date,
      to_date,
      module: module || 'fo',
      total_parties: interestCalculations.length,
      data: interestCalculations
    });
  } catch (error) {
    console.error('Error calculating interest:', error);
    res.status(500).json({ error: 'Failed to calculate interest' });
  }
});

// Calculate interest for a specific party
// GET /api/interest/party/:party_id?from_date=2024-01-01&to_date=2024-01-31&module=fo (optional, module can be 'fo' or 'equity')
app.get('/api/interest/party/:party_id', async (req, res) => {
  try {
    const { party_id } = req.params;
    const { from_date, to_date, module } = req.query;
    
    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'from_date and to_date are required' });
    }
    
    // Determine which ledger table to use (default: fo_ledger_entries)
    const ledgerTable = module === 'equity' ? 'ledger_entries' : 'fo_ledger_entries';
    
    // Get party details
    const partyResult = await pool.query(
      'SELECT id, party_code, name, interest_rate FROM party_master WHERE id = $1',
      [party_id]
    );
    
    if (partyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    const party = partyResult.rows[0];
    
    if (Number(party.interest_rate) === 0) {
      return res.json({ 
        message: 'Interest rate is 0 for this party', 
        party_code: party.party_code,
        party_name: party.name,
        interest_rate: 0,
        total_interest: 0
      });
    }
    
    // Step 1: Get balance before the period starts
    const beforePeriodQuery = await pool.query(
      `SELECT balance FROM ${ledgerTable}
       WHERE party_id = $1 AND entry_date < $2
       ORDER BY entry_date DESC, created_at DESC LIMIT 1`,
      [party_id, from_date]
    );
    
    let openingBalance = 0;
    if (beforePeriodQuery.rows.length > 0) {
      openingBalance = Number(beforePeriodQuery.rows[0].balance) || 0;
    }
    
    // Step 2: Get all ledger entries during the period
      const ledgerQuery = await pool.query(
        `SELECT entry_date, debit_amount, credit_amount, balance, reference_type, particulars
         FROM ${ledgerTable}
         WHERE party_id = $1 
           AND entry_date >= $2 
           AND entry_date <= $3
         ORDER BY entry_date ASC,
                  CASE
                    WHEN reference_type = 'carry_forward_adjustment' AND particulars ILIKE '%CF SELL%' THEN 0
                    WHEN reference_type = 'carry_forward_adjustment' AND particulars ILIKE '%CF BUY%'  THEN 2
                    ELSE 1
                  END ASC,
                  created_at ASC`,
        [party_id, from_date, to_date]
      );
    
    const ledgerEntries = ledgerQuery.rows;
    
    // Step 3: Calculate daily closing balances for every day in period
    const startDate = new Date(from_date);
    const endDate = new Date(to_date);
    const dailyBalances = [];
    const dailyOwed = [];
    let totalOwedSum = 0;
    
    let currentBalance = openingBalance;
    let ledgerIndex = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Apply all entries on this date
      while (ledgerIndex < ledgerEntries.length) {
        const entryDate = new Date(ledgerEntries[ledgerIndex].entry_date).toISOString().split('T')[0];
        if (entryDate === dateStr) {
          // Update balance with this entry
          currentBalance = Number(ledgerEntries[ledgerIndex].balance) || 0;
          ledgerIndex++;
        } else if (entryDate > dateStr) {
          break; // Entry is in future
        } else {
          ledgerIndex++; // Should not happen if query is correct
        }
      }
      
      // Record closing balance for this day
      dailyBalances.push({
        date: dateStr,
        closing_balance: currentBalance
      });
      
    // In this system, a POSITIVE ledger balance means client owes you (UI shows it as negative).
    if (currentBalance > 0) {
      const owedAmount = Math.abs(currentBalance);
        dailyOwed.push({
          date: dateStr,
          owed_amount: owedAmount,
          closing_balance: currentBalance
        });
        totalOwedSum += owedAmount;
      } else {
        dailyOwed.push({
          date: dateStr,
          owed_amount: 0,
          closing_balance: currentBalance
        });
      }
    }
    
    // Step 4: Calculate number of days
    const totalDays = dailyBalances.length;
    
    if (totalDays === 0) {
      return res.json({
        party_code: party.party_code,
        party_name: party.name,
        interest_rate: party.interest_rate,
        message: 'No days in the period',
        total_interest: 0,
        daily_breakdown: []
      });
    }
    
    // Step 5: Calculate Average Daily Owed Balance (ADB)
    const adb = totalOwedSum / totalDays;
    
    // Step 6: Apply interest rate as MONTHLY rate, pro-rated per day.
    const interestRate = Number(party.interest_rate) || 0;
    const dailyRate = interestRate / 100 / 30;
    const totalInterest = totalOwedSum * dailyRate;
    const lastOwed = dailyOwed[dailyOwed.length - 1]?.owed_amount || 0;
    
    res.json({
      party_id: party.id,
      party_code: party.party_code,
      party_name: party.name,
      interest_rate: party.interest_rate,
      from_date,
      to_date,
      module: module || 'fo',
      total_days: totalDays,
      total_owed_sum: totalOwedSum,
      average_daily_owed_balance: adb,
      total_interest: totalInterest,
      principal_plus_interest: lastOwed + totalInterest,
      daily_breakdown: dailyOwed
    });
  } catch (error) {
    console.error('Error calculating interest for party:', error);
    res.status(500).json({ error: 'Failed to calculate interest' });
  }
});


// ========================================
// F&O BILLS APIs
// ========================================

// Get all F&O bills
app.get('/api/fo/bills', async (req, res) => {
  try {
    const type = (req.query.type || '').toString();
    if (type === 'broker') {
      const q = await pool.query(`
        SELECT b.id, b.bill_number, b.broker_code, bm.name AS broker_name, 
               b.bill_date, b.due_date, b.total_amount, b.status, b.bill_type
        FROM fo_bills b
        LEFT JOIN broker_master bm ON bm.broker_code = b.broker_code
        WHERE b.bill_type = 'broker'
        ORDER BY b.bill_date DESC, b.created_at DESC
      `);
      return res.json(q.rows || []);
    }
    // default: return party bills
    const q = await pool.query(`
      SELECT b.id, b.bill_number, p.party_code, p.name AS party_name,
             b.bill_date, b.due_date, b.total_amount, b.status, b.bill_type
      FROM fo_bills b
      LEFT JOIN party_master p ON p.id = b.party_id
      WHERE b.bill_type = 'party'
      ORDER BY b.bill_date DESC, b.created_at DESC
    `);
    return res.json(q.rows || []);
  } catch (e) {
    console.error('Error fetching F&O bills:', e);
    res.status(500).json({ error: 'Failed to fetch F&O bills' });
  }
});

// Get single F&O bill by ID
app.get('/api/fo/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const billQuery = await pool.query(
      `SELECT b.*, p.party_code, p.name AS party_name, bm.name AS broker_name
       FROM fo_bills b
       LEFT JOIN party_master p ON p.id = b.party_id
       LEFT JOIN broker_master bm ON bm.broker_code = b.broker_code
       WHERE b.id = $1`,
      [id]
    );
    
    if (billQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(billQuery.rows[0]);
  } catch (error) {
    console.error('Error fetching F&O bill:', error);
    res.status(500).json({ error: 'Failed to fetch F&O bill' });
  }
});

// Get F&O bill items
app.get('/api/fo/bills/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const itemsQuery = await pool.query(
      `SELECT bi.*, i.symbol, i.instrument_type, i.expiry_date, i.strike_price, i.display_name
       FROM fo_bill_items bi
       LEFT JOIN fo_instrument_master i ON i.id = bi.instrument_id
       WHERE bi.bill_id = $1
       ORDER BY bi.id`,
      [id]
    );
    
    res.json(itemsQuery.rows || []);
  } catch (error) {
    console.error('Error fetching F&O bill items:', error);
    res.status(500).json({ error: 'Failed to fetch F&O bill items' });
  }
});

// Create F&O bill
app.post('/api/fo/bills', async (req, res) => {
  try {
    const { bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO fo_bills (bill_number, party_id, bill_date, due_date, total_amount, notes, bill_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [bill_number, party_id, bill_date, due_date || null, total_amount, notes || null, bill_type || 'party']
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating F&O bill:', error);
    res.status(500).json({ error: 'Failed to create F&O bill' });
  }
});

// Update F&O bill
app.put('/api/fo/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bill_number, party_id, bill_date, due_date, total_amount, notes, status } = req.body;
    
    const result = await pool.query(
      `UPDATE fo_bills 
       SET bill_number = $1, party_id = $2, bill_date = $3, due_date = $4, 
           total_amount = $5, notes = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [bill_number, party_id, bill_date, due_date || null, total_amount, notes || null, status || 'pending', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating F&O bill:', error);
    res.status(500).json({ error: 'Failed to update F&O bill' });
  }
});

// Get F&O bill profit information (for broker bills)
app.get('/api/fo/bills/:id/profit', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get profit entry from ledger for this bill
    const profitQuery = await pool.query(
      `SELECT credit_amount, particulars
       FROM fo_ledger_entries
       WHERE reference_id = $1 AND reference_type = 'sub_broker_profit'
       LIMIT 1`,
      [id]
    );
    
    if (profitQuery.rows.length === 0) {
      return res.json({ profit: 0, client_brokerage: 0, main_broker_brokerage: 0 });
    }
    
    const profitEntry = profitQuery.rows[0];
    const profit = Number(profitEntry.credit_amount) || 0;
    
    // Parse particulars to extract client and main broker brokerage
    // Format: "Sub-Broker Profit - Bill FO-BRK20251117-950 - Sub-broker: ???1000.00, Main Broker: ???500.00, Profit: ???500.00"
    const particulars = profitEntry.particulars || '';
    const clientBrokerageMatch = particulars.match(/Sub-broker: \?\?\?([\d,.]+)/i);
    const mainBrokerMatch = particulars.match(/Main Broker: \?\?\?([\d,.]+)/i);
    
    const clientBrokerage = clientBrokerageMatch ? parseFloat(clientBrokerageMatch[1].replace(/,/g, '')) : 0;
    const mainBrokerBrokerage = mainBrokerMatch ? parseFloat(mainBrokerMatch[1].replace(/,/g, '')) : 0;
    
    res.json({
      profit,
      client_brokerage: clientBrokerage,
      main_broker_brokerage: mainBrokerBrokerage
    });
  } catch (error) {
    console.error('Error fetching F&O bill profit:', error);
    res.status(500).json({ error: 'Failed to fetch F&O bill profit' });
  }
});

// Delete F&O bill
app.delete('/api/fo/bills/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    
    // Delete bill items first
    await client.query('DELETE FROM fo_bill_items WHERE bill_id = $1', [id]);
    
    // Delete bill
    await client.query('DELETE FROM fo_bills WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting F&O bill:', error);
    res.status(500).json({ error: 'Failed to delete F&O bill' });
  } finally {
    client.release();
  }
});

// ========================================
// F&O LEDGER APIs
// ========================================

// Get all F&O ledger entries
app.get('/api/fo/ledger', async (req, res) => {
  try {
    const { party_id, reference_type } = req.query;
    
    let query = `
      SELECT 
        l.*,
        CASE 
          WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN NULL
          ELSE p.party_code
        END AS party_code,
        CASE 
          WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN NULL
          ELSE p.name
        END AS party_name
      FROM fo_ledger_entries l
      LEFT JOIN party_master p ON p.id = l.party_id
      WHERE 1=1
    `;
    const params = [];
    
    if (party_id) {
      params.push(party_id);
      query += ` AND l.party_id = $${params.length}`;
    }
    
    if (reference_type) {
      params.push(reference_type);
      query += ` AND l.reference_type = $${params.length}`;
    }
    
    query += ` ORDER BY l.entry_date DESC, l.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch F&O ledger entries' });
  }
});

// Get F&O ledger entries by party ID
app.get('/api/fo/ledger/party/:party_id', async (req, res) => {
  try {
    const { party_id } = req.params;
    const result = await pool.query(
      `SELECT 
         l.*,
         CASE 
           WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN 'MAIN-BROKER'
           ELSE p.party_code
         END AS party_code,
         CASE 
           WHEN l.party_id IS NULL AND l.reference_type IN ('broker_brokerage','broker_payment') THEN 'Main Broker'
           ELSE p.name
         END AS party_name
       FROM fo_ledger_entries l
       LEFT JOIN party_master p ON p.id = l.party_id
       WHERE l.party_id = $1
       ORDER BY l.entry_date DESC, l.created_at DESC`,
      [party_id]
    );
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch F&O ledger entries' });
  }
});

// Create F&O ledger entry
app.post('/api/fo/ledger', async (req, res) => {
  try {
    const { party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [party_id || null, entry_date, particulars, debit_amount || 0, credit_amount || 0, balance, reference_type || null, reference_id || null]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating F&O ledger entry:', error);
    res.status(500).json({ error: 'Failed to create F&O ledger entry' });
  }
});

// Update F&O ledger entry
app.put('/api/fo/ledger/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { party_id, entry_date, particulars, debit_amount, credit_amount, balance } = req.body;
    
    const result = await pool.query(
      `UPDATE fo_ledger_entries 
       SET party_id = $1, entry_date = $2, particulars = $3, 
           debit_amount = $4, credit_amount = $5, balance = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [party_id || null, entry_date, particulars, debit_amount || 0, credit_amount || 0, balance, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating F&O ledger entry:', error);
    res.status(500).json({ error: 'Failed to update F&O ledger entry' });
  }
});

// Delete F&O ledger entry
app.delete('/api/fo/ledger/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fo_ledger_entries WHERE id = $1', [id]);
    res.json({ message: 'Ledger entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting F&O ledger entry:', error);
    res.status(500).json({ error: 'Failed to delete F&O ledger entry' });
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

function normalizeRow(raw) {
  const clientIdRaw = (raw.ClientId || raw.clientId || raw.client_id || '').toString();
  const brokerIdRaw = (raw.brokerid || raw.brokerId || raw.BrokerId || '').toString();
  return {
    expiryDate: raw.ExpiryDate || raw.expiryDate || raw.expiry_date || null,
    securityName: raw.SecurityName || raw.securityName || raw.symbol || '',
    side: (raw.Side || raw.side || '').toString(),
    quantity: Number(raw.Quantity ?? raw.quantity ?? 0),
    price: Number(raw.Price ?? raw.price ?? 0),
    clientId: clientIdRaw.trim().toUpperCase(),
    brokerId: brokerIdRaw.trim().toUpperCase(),
    type: (raw.Type || raw.type || '').toString().trim().toUpperCase(),
  };
}

// =========================
// BALANCE RECALCULATION API
// =========================

// Recalculate all balances for equity ledger
app.post('/api/ledger/recalculate-balances', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all parties
    const partiesResult = await client.query('SELECT id, party_code FROM party_master ORDER BY party_code');
    const parties = partiesResult.rows;

    let totalUpdated = 0;

    // Process each party
    for (const party of parties) {
      // Get all ledger entries for this party, ordered by date
      const entriesResult = await client.query(
        `SELECT id, debit_amount, credit_amount, entry_date
         FROM ledger_entries
         WHERE party_id = $1
         ORDER BY entry_date ASC, created_at ASC`,
        [party.id]
      );

      let runningBalance = 0;
      const entries = entriesResult.rows;

      // Recalculate balance for each entry
      for (const entry of entries) {
        const debit = Number(entry.debit_amount) || 0;
        const credit = Number(entry.credit_amount) || 0;
        
        // Correct accounting: Debit increases balance, Credit decreases balance
        runningBalance = runningBalance + debit - credit;

        // Update the entry with correct balance
        await client.query(
          'UPDATE ledger_entries SET balance = $1 WHERE id = $2',
          [runningBalance, entry.id]
        );
        totalUpdated++;
      }

      console.log(`Recalculated ${entries.length} entries for party ${party.party_code}, final balance: ${runningBalance}`);
    }

    // Process broker entries (party_id IS NULL)
    const brokerEntriesResult = await client.query(
      `SELECT id, debit_amount, credit_amount, entry_date, reference_type
       FROM ledger_entries
       WHERE party_id IS NULL
       ORDER BY entry_date ASC, created_at ASC`
    );

    // Group broker entries by reference_type
    const brokerGroups = {};
    for (const entry of brokerEntriesResult.rows) {
      const refType = entry.reference_type || 'unknown';
      if (!brokerGroups[refType]) {
        brokerGroups[refType] = [];
      }
      brokerGroups[refType].push(entry);
    }

    // Recalculate each broker group separately
    for (const [refType, entries] of Object.entries(brokerGroups)) {
      let runningBalance = 0;

      for (const entry of entries) {
        const debit = Number(entry.debit_amount) || 0;
        const credit = Number(entry.credit_amount) || 0;
        
        // Correct accounting: Credit increases what you owe to broker (positive)
        // Debit decreases what you owe (negative means broker owes you)
        runningBalance = runningBalance + credit - debit;

        await client.query(
          'UPDATE ledger_entries SET balance = $1 WHERE id = $2',
          [runningBalance, entry.id]
        );
        totalUpdated++;
      }

      console.log(`Recalculated ${entries.length} entries for broker type ${refType}, final balance: ${runningBalance}`);
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'All balances recalculated successfully',
      totalUpdated
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recalculating balances:', error);
    res.status(500).json({
      error: 'Failed to recalculate balances',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Recalculate all balances for F&O ledger
app.post('/api/fo/ledger/recalculate-balances', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all parties
    const partiesResult = await client.query('SELECT id, party_code FROM party_master ORDER BY party_code');
    const parties = partiesResult.rows;

    let totalUpdated = 0;

    // Process each party
    for (const party of parties) {
      // Get all F&O ledger entries for this party, ordered by date
      const entriesResult = await client.query(
        `SELECT id, debit_amount, credit_amount, entry_date
         FROM fo_ledger_entries
         WHERE party_id = $1
         ORDER BY entry_date ASC, created_at ASC`,
        [party.id]
      );

      let runningBalance = 0;
      const entries = entriesResult.rows;

      // Recalculate balance for each entry
      for (const entry of entries) {
        const debit = Number(entry.debit_amount) || 0;
        const credit = Number(entry.credit_amount) || 0;
        
        // Correct accounting: Debit increases balance, Credit decreases balance
        runningBalance = runningBalance + debit - credit;

        // Update the entry with correct balance
        await client.query(
          'UPDATE fo_ledger_entries SET balance = $1 WHERE id = $2',
          [runningBalance, entry.id]
        );
        totalUpdated++;
      }

      console.log(`Recalculated ${entries.length} F&O entries for party ${party.party_code}, final balance: ${runningBalance}`);
    }

    // Process broker entries (party_id IS NULL)
    const brokerEntriesResult = await client.query(
      `SELECT id, debit_amount, credit_amount, entry_date, reference_type
       FROM fo_ledger_entries
       WHERE party_id IS NULL
       ORDER BY entry_date ASC, created_at ASC`
    );

    // Group broker entries by reference_type
    const brokerGroups = {};
    for (const entry of brokerEntriesResult.rows) {
      const refType = entry.reference_type || 'unknown';
      if (!brokerGroups[refType]) {
        brokerGroups[refType] = [];
      }
      brokerGroups[refType].push(entry);
    }

    // Recalculate each broker group separately
    for (const [refType, entries] of Object.entries(brokerGroups)) {
      let runningBalance = 0;

      for (const entry of entries) {
        const debit = Number(entry.debit_amount) || 0;
        const credit = Number(entry.credit_amount) || 0;
        
        // Correct accounting: Credit increases what you owe to broker
        runningBalance = runningBalance + credit - debit;

        await client.query(
          'UPDATE fo_ledger_entries SET balance = $1 WHERE id = $2',
          [runningBalance, entry.id]
        );
        totalUpdated++;
      }

      console.log(`Recalculated ${entries.length} F&O entries for broker type ${refType}, final balance: ${runningBalance}`);
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'All F&O balances recalculated successfully',
      totalUpdated
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recalculating F&O balances:', error);
    res.status(500).json({
      error: 'Failed to recalculate F&O balances',
      details: error.message
    });
  } finally {
    client.release();
  }
});


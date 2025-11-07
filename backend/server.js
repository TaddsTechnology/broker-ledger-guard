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
    const { type } = req.query;
    
    let query = `
      SELECT b.*, 
             p.party_code, 
             p.name as party_name,
             br.broker_code as broker_code_name,
             br.name as broker_name
      FROM bills b 
      LEFT JOIN party_master p ON b.party_id = p.id
      LEFT JOIN broker_master br ON b.broker_code = br.broker_code
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
      `SELECT b.*, 
              p.party_code, 
              p.name as party_name,
              br.broker_code as broker_code_name,
              br.name as broker_name
       FROM bills b 
       LEFT JOIN party_master p ON b.party_id = p.id 
       LEFT JOIN broker_master br ON b.broker_code = br.broker_code
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

app.get('/api/bills/number/:billNumber', async (req, res) => {
  try {
    const { billNumber } = req.params;
    const result = await pool.query(
      `SELECT b.*, 
              p.party_code, 
              p.name as party_name,
              br.broker_code as broker_code_name,
              br.name as broker_name
       FROM bills b 
       LEFT JOIN party_master p ON b.party_id = p.id 
       LEFT JOIN broker_master br ON b.broker_code = br.broker_code
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

// Get bill items
app.get('/api/bills/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching bill items for bill ID:', id);
    const result = await pool.query(
      `SELECT *, trade_type FROM bill_items WHERE bill_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    console.log('Bill items result for ID', id, ':', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bill items:', error);
    res.status(500).json({ error: 'Failed to fetch bill items', details: error.message });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const { bill_number, party_id, broker_id, broker_code, bill_date, due_date, total_amount, notes, bill_type } = req.body;
    // Handle null party_id for broker bills
    const partyIdValue = party_id || null;
    const brokerIdValue = broker_id || null;
    const brokerCodeValue = broker_code || null;
    console.log('Creating bill with data:', { bill_number, party_id: partyIdValue, broker_id: brokerIdValue, broker_code: brokerCodeValue, bill_date, due_date, total_amount, notes, bill_type });
    const result = await pool.query(
      'INSERT INTO bills (bill_number, party_id, broker_id, broker_code, bill_date, due_date, total_amount, notes, bill_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [bill_number, partyIdValue, brokerIdValue, brokerCodeValue, bill_date, due_date, total_amount, notes, bill_type || 'party']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill', details: error.message });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { bill_number, party_id, broker_id, broker_code, bill_date, due_date, total_amount, notes, bill_type, items } = req.body;
    
    console.log('Updating bill with ID:', id);
    console.log('Bill data:', { bill_number, party_id, broker_id, broker_code, bill_date, due_date, total_amount, notes, bill_type });
    console.log('Items data:', items);
    
    // Update bill
    const billResult = await client.query(
      'UPDATE bills SET bill_number = $1, party_id = $2, broker_id = $3, broker_code = $4, bill_date = $5, due_date = $6, total_amount = $7, notes = $8, bill_type = $9, updated_at = NOW() WHERE id = $10 RETURNING *',
      [bill_number, party_id || null, broker_id || null, broker_code || null, bill_date, due_date, total_amount, notes, bill_type || 'party', id]
    );
    
    // If items are provided, update them as well
    if (items && Array.isArray(items)) {
      console.log('Deleting existing items for bill ID:', id);
      // Delete existing items
      await client.query('DELETE FROM bill_items WHERE bill_id = $1', [id]);
      
      console.log('Inserting', items.length, 'new items for bill ID:', id);
      // Insert new items
      for (const item of items) {
        console.log('Inserting item:', item);
        await client.query(
          `INSERT INTO bill_items (bill_id, description, quantity, rate, amount, client_code, company_code, trade_type, brokerage_rate_pct, brokerage_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            item.description,
            item.quantity,
            item.rate,
            item.amount,
            item.client_code || null,
            item.company_code || null,
            (item.trade_type || item.type || '').toString().trim().toUpperCase(), // Add trade_type
            item.brokerage_rate_pct || null,
            item.brokerage_amount || null
          ]
        );
      }
      console.log('Successfully inserted all items for bill ID:', id);
    }
    
    await client.query('COMMIT');
    console.log('Successfully updated bill with ID:', id);
    res.json(billResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  } finally {
    client.release();
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
      const billsRaw = await Promise.all(brokers.map(async (brokerId) => {
        const bRows = brokerIdToRows[brokerId];
        const clientSet = new Set(bRows.map((r) => r.clientId).filter(Boolean));
        const companyCodeSet = new Set(bRows.map((r) => r.company_code).filter(Boolean));

        // Fetch party names for all clients
        const clientPartyMap = {};
        for (const clientCode of Array.from(clientSet)) {
          try {
            const partyResult = await pool.query(
              'SELECT party_code, name FROM party_master WHERE UPPER(party_code) = UPPER($1) LIMIT 1',
              [clientCode]
            );
            if (partyResult.rows.length > 0) {
              clientPartyMap[clientCode] = partyResult.rows[0].name;
            }
          } catch (e) {
            console.error('Error fetching party name for', clientCode, e);
          }
        }

        return {
          brokerId,
          clients: Array.from(clientSet),
          clientPartyMap, // Add party names mapping
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
      }));

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
    console.log('Creating broker bill with params:', { brokerId, brokerCode, billDate, dueDate, itemsCount: items?.length });
    
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
      console.log('Found broker_id:', broker_id, 'for brokerCode:', normBrokerCode);
    } catch (e) {
      console.error('Error fetching broker_id:', e);
    }

    // Load party slabs for involved clients to recalculate brokerage
    const uniqueClients = Array.from(new Set(items.map(r => r.clientId).filter(Boolean)));
    const partySlabMap = await getPartySlabs(uniqueClients);
    
    // Recalculate brokerage for each item based on Type and party slabs
    const itemsWithRecalculatedBrokerage = items.map(item => {
      const { brokerageRatePct, brokerageAmount } = computeBrokerageForRow(item, partySlabMap);
      return { 
        ...item, 
        brokerage_rate_pct: brokerageRatePct, 
        brokerage_amount: brokerageAmount,
        amount: Number(item.amount) || (Number(item.quantity) * Number(item.price)) // Ensure amount is calculated
      };
    });

    // Compute totals based on recalculated brokerage
    const totalAmount = itemsWithRecalculatedBrokerage.reduce((s, it) => s + (Number(it.brokerage_amount) || 0), 0);
    console.log('Computed total brokerage amount:', totalAmount);

    // Dates
    const now = new Date();
    const billDateStr = billDate || now.toISOString().slice(0, 10);
    const dueDateStr = dueDate || null;

    // Check if a broker bill already exists for the same broker and date to prevent duplicates
    // Use a more precise query to check for existing bills
    console.log('Checking for existing bill with brokerCode:', normBrokerCode, 'billDate:', billDateStr);
    const existingBill = await pool.query(
      `SELECT id, total_amount FROM bills 
       WHERE bill_type = 'broker' 
       AND UPPER(broker_code) = UPPER($1) 
       AND bill_date = $2 
       LIMIT 1`,
      [normBrokerCode, billDateStr]
    );
    console.log('Existing bill check result:', existingBill.rows);

    if (existingBill.rows.length > 0) {
      // If bill exists, update the total amount and add items to existing bill
      const billId = existingBill.rows[0].id;
      const currentTotal = parseFloat(existingBill.rows[0].total_amount) || 0;
      const newTotal = currentTotal + totalAmount;
      console.log('Updating existing bill with ID:', billId, 'new total:', newTotal);

      // Update bill total amount
      await pool.query(
        `UPDATE bills SET total_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newTotal, billId]
      );

      // Insert new items with recalculated brokerage
      console.log('Inserting', itemsWithRecalculatedBrokerage.length, 'items into existing bill');
      const insertItem = `INSERT INTO bill_items (bill_id, description, quantity, rate, amount, client_code, company_code, trade_type, brokerage_rate_pct, brokerage_amount)
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
      for (const it of itemsWithRecalculatedBrokerage) {
        console.log('Inserting item:', it);
        try {
          // Ensure company_code is extracted from securityName if not provided
          const companyInfo = it.company_code ? { company_code: it.company_code } : extractCompanyFromSecurityName(it.securityName);
          
          await pool.query(insertItem, [
            billId,
            it.securityName || `${it.company_code || ''}`,
            Number(it.quantity) || 0,
            Number(it.price) || 0,
            Number(it.amount) || 0,
            (it.clientId || '').toString().trim().toUpperCase(),
            companyInfo.company_code || null,
            (it.type || '').toString().trim().toUpperCase(),  // Add trade_type
            Number(it.brokerage_rate_pct) || 0,
            Number(it.brokerage_amount) || 0,
          ]);
          console.log('Successfully inserted item for bill ID:', billId);
        } catch (insertError) {
          console.error('Error inserting item:', insertError);
        }
      }

      // Create ledger entry for the broker (to track what we owe the broker)
      try {
        const ledgerInsert = `INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance)
                             VALUES ($1, $2, $3, $4, $5, $6)`;
        const particulars = `Additional brokerage for bill BRK${billDateStr.replace(/-/g, '').slice(2)}-${billId.slice(0, 3)}`;
        // Credit to broker (we owe them this amount)
        await pool.query(ledgerInsert, [
          null, // party_id is null for broker entries
          billDateStr,
          particulars,
          0, // debit_amount
          totalAmount, // credit_amount (the additional brokerage amount)
          0 // balance
        ]);
        console.log('Created broker ledger entry for additional brokerage');
      } catch (ledgerError) {
        console.error('Error creating broker ledger entry:', ledgerError);
      }

      // Create party ledger entries - add brokerage to each party's debit
      try {
        // Group items by client_code to get brokerage per party
        const partyBrokerageMap = new Map();
        for (const item of itemsWithRecalculatedBrokerage) {
          const clientCode = (item.clientId || '').toString().trim().toUpperCase();
          if (clientCode) {
            const currentAmount = partyBrokerageMap.get(clientCode) || 0;
            partyBrokerageMap.set(clientCode, currentAmount + (Number(item.brokerage_amount) || 0));
          }
        }

        // Create ledger entries for each party
        for (const [clientCode, brokerageAmount] of partyBrokerageMap.entries()) {
          // Get party_id from party_code
          const partyResult = await pool.query(
            'SELECT id FROM party_master WHERE UPPER(party_code) = UPPER($1) LIMIT 1',
            [clientCode]
          );
          
          if (partyResult.rows.length > 0) {
            const partyId = partyResult.rows[0].id;
            
            // Get current balance for this party
            const balanceResult = await pool.query(
              'SELECT balance FROM ledger_entries WHERE party_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
              [partyId]
            );
            const currentBalance = balanceResult.rows.length > 0 ? Number(balanceResult.rows[0].balance) : 0;
            const newBalance = currentBalance + brokerageAmount;

            const ledgerInsert = `INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance)
                                 VALUES ($1, $2, $3, $4, $5, $6)`;
            const billNumberShort = `BRK${billDateStr.replace(/-/g, '').slice(2)}-${billId.slice(0, 3)}`;
            const particulars = `Brokerage charges - Bill ${billNumberShort}`;
            
            await pool.query(ledgerInsert, [
              partyId,
              billDateStr,
              particulars,
              brokerageAmount, // debit_amount - party owes this amount
              0, // credit_amount
              newBalance // updated balance
            ]);
            console.log(`Created party ledger entry for client ${clientCode}, amount: ${brokerageAmount}`);
          }
        }
      } catch (partyLedgerError) {
        console.error('Error creating party ledger entries:', partyLedgerError);
      }

      return res.json({ ok: true, bill_id: billId, message: 'Items added to existing bill' });
    } else {
      // Create new bill if none exists
      console.log('No existing bill found, creating new bill for brokerCode:', normBrokerCode, 'billDate:', billDateStr);
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      
      // Generate a unique bill number to prevent duplicates
      const getRandomSuffix = () => String(Math.floor(Math.random() * 900) + 100);
      let billNumber = `BRK${y}${m}${d}-${getRandomSuffix()}`;
      
      // Check if this bill number already exists and generate a new one if needed
      let billExists = true;
      let attempts = 0;
      while (billExists && attempts < 10) {
        const check = await pool.query('SELECT id FROM bills WHERE bill_number = $1 LIMIT 1', [billNumber]);
        billExists = check.rows.length > 0;
        if (billExists) {
          billNumber = `BRK${y}${m}${d}-${getRandomSuffix()}`;
          attempts++;
        } else {
          break;
        }
      }

      const insertBill = `INSERT INTO bills (bill_number, party_id, broker_id, broker_code, bill_date, due_date, total_amount, paid_amount, status, notes, bill_type)
                          VALUES ($1, NULL, $2, $3, $4, $5, $6, 0.00, 'pending', NULL, 'broker') RETURNING id`;
      const billRes = await pool.query(insertBill, [
        billNumber,
        broker_id,  // This will be null if broker not found, which is correct
        normBrokerCode,
        billDateStr,
        dueDateStr,
        totalAmount,
      ]);
      const billId = billRes.rows[0].id;
      console.log('Created new bill with ID:', billId, 'billNumber:', billNumber);

      // Insert items with recalculated brokerage
      console.log('Inserting', itemsWithRecalculatedBrokerage.length, 'items into new bill');
      const insertItem = `INSERT INTO bill_items (bill_id, description, quantity, rate, amount, client_code, company_code, trade_type, brokerage_rate_pct, brokerage_amount)
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
      for (const it of itemsWithRecalculatedBrokerage) {
        console.log('Inserting item:', it);
        try {
          // Ensure company_code is extracted from securityName if not provided
          const companyInfo = it.company_code ? { company_code: it.company_code } : extractCompanyFromSecurityName(it.securityName);
          
          await pool.query(insertItem, [
            billId,
            it.securityName || `${it.company_code || ''}`,
            Number(it.quantity) || 0,
            Number(it.price) || 0,
            Number(it.amount) || 0,
            (it.clientId || '').toString().trim().toUpperCase(),
            companyInfo.company_code || null,
            (it.type || '').toString().trim().toUpperCase(),  // Add trade_type
            Number(it.brokerage_rate_pct) || 0,
            Number(it.brokerage_amount) || 0,
          ]);
          console.log('Successfully inserted item for bill ID:', billId);
        } catch (insertError) {
          console.error('Error inserting item:', insertError);
        }
      }

      // Create ledger entry for the broker (to track what we owe the broker)
      try {
        const ledgerInsert = `INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance)
                             VALUES ($1, $2, $3, $4, $5, $6)`;
        const particulars = `Brokerage for bill ${billNumber}`;
        // Credit to broker (we owe them this amount)
        await pool.query(ledgerInsert, [
          null, // party_id is null for broker entries
          billDateStr,
          particulars,
          0, // debit_amount
          totalAmount, // credit_amount (total brokerage amount)
          0 // balance
        ]);
        console.log('Created broker ledger entry for bill:', billNumber);
      } catch (ledgerError) {
        console.error('Error creating broker ledger entry:', ledgerError);
      }

      // Create party ledger entries - add brokerage to each party's debit
      try {
        // Group items by client_code to get brokerage per party
        const partyBrokerageMap = new Map();
        for (const item of itemsWithRecalculatedBrokerage) {
          const clientCode = (item.clientId || '').toString().trim().toUpperCase();
          if (clientCode) {
            const currentAmount = partyBrokerageMap.get(clientCode) || 0;
            partyBrokerageMap.set(clientCode, currentAmount + (Number(item.brokerage_amount) || 0));
          }
        }

        // Create ledger entries for each party
        for (const [clientCode, brokerageAmount] of partyBrokerageMap.entries()) {
          // Get party_id from party_code
          const partyResult = await pool.query(
            'SELECT id FROM party_master WHERE UPPER(party_code) = UPPER($1) LIMIT 1',
            [clientCode]
          );
          
          if (partyResult.rows.length > 0) {
            const partyId = partyResult.rows[0].id;
            
            // Get current balance for this party
            const balanceResult = await pool.query(
              'SELECT balance FROM ledger_entries WHERE party_id = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
              [partyId]
            );
            const currentBalance = balanceResult.rows.length > 0 ? Number(balanceResult.rows[0].balance) : 0;
            const newBalance = currentBalance + brokerageAmount;

            const ledgerInsert = `INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance)
                                 VALUES ($1, $2, $3, $4, $5, $6)`;
            const particulars = `Brokerage charges - Bill ${billNumber}`;
            
            await pool.query(ledgerInsert, [
              partyId,
              billDateStr,
              particulars,
              brokerageAmount, // debit_amount - party owes this amount
              0, // credit_amount
              newBalance // updated balance
            ]);
            console.log(`Created party ledger entry for client ${clientCode}, amount: ${brokerageAmount}`);
          }
        }
      } catch (partyLedgerError) {
        console.error('Error creating party ledger entries:', partyLedgerError);
      }

      return res.json({ ok: true, bill_id: billId, message: 'New bill created' });
    }
  } catch (error) {
    console.error('Error in create-broker:', error);
    res.status(500).json({ error: 'Failed to create broker bill', details: error.message });
  }
});

// List bills; supports type=broker to fetch consolidated broker bills only
app.get('/api/bills', async (req, res) => {
  try {
    const type = (req.query.type || '').toString();
    console.log('Fetching bills with type:', type);
    if (type === 'broker') {
      const q = await pool.query(`
        SELECT b.id, b.bill_number, b.broker_code, b.bill_date, b.due_date, 
               b.total_amount, b.status, b.bill_type,
               br.name as broker_name
        FROM bills b
        LEFT JOIN broker_master br ON b.broker_code = br.broker_code
        WHERE b.bill_type = 'broker'
        ORDER BY b.bill_date DESC, b.created_at DESC
      `);
      console.log('Broker bills result:', q.rows);
      return res.json(q.rows || []);
    }
    // default: return all bills (party and broker)
    const q = await pool.query(`
      SELECT b.id, b.bill_number, p.party_code, p.name AS party_name, 
             b.broker_code, br.name as broker_name,
             b.bill_date, b.due_date, b.total_amount, b.status, b.bill_type
      FROM bills b
      LEFT JOIN party_master p ON p.id = b.party_id
      LEFT JOIN broker_master br ON b.broker_code = br.broker_code
      ORDER BY b.bill_date DESC, b.created_at DESC
    `);
    console.log('All bills result:', q.rows);
    return res.json(q.rows || []);
  } catch (e) {
    console.error('Error fetching bills:', e);
    res.status(500).json({ error: 'Failed to fetch bills', details: e.message });
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

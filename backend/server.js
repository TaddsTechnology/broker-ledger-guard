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
    
    const { contracts, billDate } = req.body;
    
    if (!Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: 'contracts must be a non-empty array' });
    }
    
    const now = new Date();
    const billDateStr = billDate || now.toISOString().slice(0, 10);
    
    // Group contracts by party and broker
    const partyGroups = {};
    const brokerGroups = {};
    
    const createdContracts = [];
    
    for (const contract of contracts) {
      const { party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, notes, company_id, trade_type } = contract;
      
      // Generate sequential contract number
      // Get the latest contract number
      const lastContractQuery = await client.query(
        'SELECT contract_number FROM contracts ORDER BY created_at DESC LIMIT 1'
      );
      
      let nextNumber = 1;
      if (lastContractQuery.rows.length > 0) {
        const lastNumber = lastContractQuery.rows[0].contract_number;
        // Extract number from format like "001" or "CNT-001"
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const contract_number = String(nextNumber).padStart(3, '0');
      
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
      let totalBrokerage = 0;
      
      for (const contract of brokerContracts) {
        totalBrokerage += Number(contract.brokerage_amount) || 0;
      }
      
      // Generate broker bill number
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      const brokerBillNumber = `BRK${y}${m}${d}-${suffix}`;
      
      // Get broker code
      const brokerCode = brokerContracts[0].broker_code;
      
      // Create broker bill
      const brokerBillResult = await client.query(
        'INSERT INTO bills (bill_number, broker_id, broker_code, bill_date, total_amount, bill_type, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          brokerBillNumber,
          broker_id,
          brokerCode,
          billDateStr,
          totalBrokerage,
          'broker',
          'pending',
          `Brokerage from ${brokerContracts.length} contracts`
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
      
      brokerBalance += totalBrokerage;
      
      // Create broker ledger entry
      const brokerLedgerResult = await client.query(
        'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Brokerage - Bill ${brokerBillNumber} (${brokerContracts.length} contracts)`,
          0,
          totalBrokerage,
          brokerBalance,
          'broker_brokerage',
          brokerBill.id
        ]
      );
      
      ledgerEntries.push(brokerLedgerResult.rows[0]);
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

    // Collect all bill items for broker bill
    const allBrokerBillItems = [];
    let totalBrokerageAllClients = 0;
    let brokerIdGlobal = null;

    // Group trades by client
    const clientGroups = {};
    for (const trade of trades) {
      const clientId = (trade.ClientId || trade.clientId || '').toString().trim().toUpperCase();
      if (!clientId) continue;
      
      if (!clientGroups[clientId]) clientGroups[clientId] = [];
      clientGroups[clientId].push(trade);
    }

    const now = new Date();
    const billDateStr = billDate || now.toISOString().slice(0, 10);

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
      let totalBuyAmount = 0;
      let totalSellAmount = 0;

      // Process each trade
      for (const trade of clientTrades) {
        const securityName = trade.SecurityName || trade.securityName || '';
        const side = (trade.Side || trade.side || '').toString().toUpperCase();
        
        // Get quantity based on side
        let quantity = 0;
        if (side === 'BUY') {
          quantity = Number(trade.BuyQty || trade.Quantity || trade.quantity || 0);
        } else if (side === 'SELL') {
          quantity = Number(trade.SellQty || trade.Quantity || trade.quantity || 0);
        } else {
          quantity = Number(trade.BuyQty || trade.SellQty || trade.Quantity || trade.quantity || 0);
        }
        
        // Get price based on side
        let price = 0;
        if (side === 'BUY') {
          price = Number(trade.BuyAvg || trade.Price || trade.price || 0);
        } else if (side === 'SELL') {
          price = Number(trade.SellAvg || trade.Price || trade.price || 0);
        } else {
          price = Number(trade.BuyAvg || trade.SellAvg || trade.Price || trade.price || 0);
        }
        
        const type = (trade.Type || trade.type || '').toString().toUpperCase();
        const amount = quantity * price;
        
        // Skip if quantity or price is 0
        if (quantity === 0 || price === 0) {
          console.warn(`Skipping trade with zero quantity or price: ${securityName}`);
          continue;
        }

        // Calculate brokerage
        const brokerageRate = type === 'T' ? Number(party.trading_slab) : Number(party.delivery_slab);
        const brokerageAmount = (amount * brokerageRate) / 100;
        totalBrokerage += brokerageAmount;

        // Track buy/sell amounts for trade settlement ledger
        if (side === 'BUY') {
          totalBuyAmount += amount;
        } else if (side === 'SELL') {
          totalSellAmount += amount;
        }

        billItems.push({
          description: `${securityName} - ${side}`,
          quantity,
          rate: price,
          amount,
          client_code: clientId,
          company_code: extractCompanyFromSecurityName(securityName).company_code,
          brokerage_rate_pct: brokerageRate,
          brokerage_amount: brokerageAmount,
          trade_type: type, // Store D or T
        });
      }

      // Calculate net trade settlement
      const netTradeAmount = totalBuyAmount - totalSellAmount;
      
      // Calculate final client balance: Net Trade + Total Brokerage
      // Client owes: (Buy - Sell) + Brokerage
      // If Buy > Sell: Client owes money for net purchase + brokerage
      // If Sell > Buy: Client receives money but must pay brokerage, so receives less
      // If Buy = Sell: Client owes only the brokerage
      const finalClientBalance = netTradeAmount + totalBrokerage;

      // Get current client balance (consolidated)
      let currentClientBalance = 0;
      const clientBalanceQuery = await client.query(
        'SELECT balance FROM ledger_entries WHERE party_id = $1 AND reference_type = $2 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        [party.id, 'client_settlement']
      );
      if (clientBalanceQuery.rows.length > 0) {
        currentClientBalance = Number(clientBalanceQuery.rows[0].balance) || 0;
      }
      
      // Update the running balance
      const newClientBalance = currentClientBalance + finalClientBalance;

      // Always create new bill for each CSV upload
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const suffix = String(Math.floor(Math.random() * 900) + 100);
      const billNumber = `PTY${y}${m}${d}-${suffix}`;

      // Bill amount is the final amount client needs to pay (or receive if negative)
      const billResult = await client.query(
        'INSERT INTO bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [billNumber, party.id, billDateStr, finalClientBalance, 'party', 'pending']
      );

      const billId = billResult.rows[0].id;

      // Create single consolidated ledger entry
      // Debit when client owes money (buy + brokerage)
      // Credit when client receives money (sell - brokerage)
      const debitAmount = finalClientBalance > 0 ? finalClientBalance : 0;
      const creditAmount = finalClientBalance < 0 ? Math.abs(finalClientBalance) : 0;
      
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

      // Track broker ID and get broker details for their cut
      if (!brokerIdGlobal) {
        brokerIdGlobal = (clientTrades[0].brokerid || clientTrades[0].brokerId || 'BROKER').toString().toUpperCase();
      }
      
      // Get broker details to calculate their share
      let brokerShareTotal = 0;
      const brokerQuery = await client.query(
        'SELECT id, broker_code, name, trading_slab, delivery_slab FROM broker_master WHERE UPPER(broker_code) = $1',
        [brokerIdGlobal]
      );
      
      if (brokerQuery.rows.length > 0) {
        const broker = brokerQuery.rows[0];
        
        // Calculate broker's share for each trade
        for (const item of billItems) {
          const brokerRate = item.trade_type === 'T' ? Number(broker.trading_slab) : Number(broker.delivery_slab);
          const brokerShare = (item.amount * brokerRate) / 100;
          brokerShareTotal += brokerShare;
          
          // Store broker share in item for broker bill
          item.broker_share = brokerShare;
        }
      }
      
      // Add this client's items to broker bill items
      allBrokerBillItems.push(...billItems);
      // Broker bill total = full sub-brokerage from all clients
      totalBrokerageAllClients += totalBrokerage;

      // Insert bill items with trade_type
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

      // Update stock holdings directly (without creating contracts)
      for (const item of billItems) {
        // Auto-create company if doesn't exist
        let company_id = null;
        if (item.company_code) {
          const companyQuery = await client.query(
            'SELECT id FROM company_master WHERE UPPER(company_code) = $1',
            [item.company_code.toUpperCase()]
          );
          if (companyQuery.rows.length > 0) {
            company_id = companyQuery.rows[0].id;
          } else {
            // Auto-create company from CSV
            const newCompanyResult = await client.query(
              'INSERT INTO company_master (company_code, name, nse_code) VALUES ($1, $2, $3) RETURNING id',
              [item.company_code.toUpperCase(), item.company_code.toUpperCase(), item.company_code.toUpperCase()]
            );
            company_id = newCompanyResult.rows[0].id;
            console.log(`  ✓ Auto-created company: ${item.company_code}`);
          }
        }

        if (company_id) {
          // Determine if BUY or SELL
          const isBuy = item.description.toUpperCase().includes('BUY');
          const qtyChange = isBuy ? item.quantity : -item.quantity;

          // Check if holding exists
          const holdingQuery = await client.query(
            'SELECT id, quantity, total_invested, avg_buy_price FROM stock_holdings WHERE party_id = $1 AND company_id = $2',
            [party.id, company_id]
          );

          if (holdingQuery.rows.length > 0) {
            // Update existing holding
            const holding = holdingQuery.rows[0];
            const currentQty = Number(holding.quantity);
            const currentInvested = Number(holding.total_invested);
            const newQty = currentQty + qtyChange;

            if (isBuy) {
              // Add to holdings
              const newInvested = currentInvested + item.amount;
              const newAvgPrice = newQty > 0 ? newInvested / newQty : holding.avg_buy_price;
              
              await client.query(
                'UPDATE stock_holdings SET quantity = $1, total_invested = $2, avg_buy_price = $3, last_trade_date = $4, last_updated = NOW() WHERE id = $5',
                [newQty, newInvested, newAvgPrice, billDateStr, holding.id]
              );
            } else {
              // Sell - reduce holdings
              const newInvested = newQty > 0 ? (currentInvested / currentQty) * newQty : 0;
              
              await client.query(
                'UPDATE stock_holdings SET quantity = $1, total_invested = $2, last_trade_date = $3, last_updated = NOW() WHERE id = $4',
                [newQty, newInvested, billDateStr, holding.id]
              );
            }
          } else if (isBuy) {
            // Create new holding (only for BUY)
            await client.query(
              'INSERT INTO stock_holdings (party_id, company_id, quantity, avg_buy_price, total_invested, last_trade_date) VALUES ($1, $2, $3, $4, $5, $6)',
              [party.id, company_id, item.quantity, item.rate, item.amount, billDateStr]
            );
          } else {
            // Selling without holding - create negative position
            await client.query(
              'INSERT INTO stock_holdings (party_id, company_id, quantity, avg_buy_price, total_invested, last_trade_date) VALUES ($1, $2, $3, $4, $5, $6)',
              [party.id, company_id, -item.quantity, item.rate, 0, billDateStr]
            );
          }
        }
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

    // Always create new broker bill for each CSV upload
    if (allBrokerBillItems.length > 0 && brokerIdGlobal) {
      const clientList = Object.keys(clientGroups).join(', ');
      
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
          totalBrokerageAllClients,
          'broker',
          'pending',
          `Brokerage from clients: ${clientList} - ${allBrokerBillItems.length} trades`
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

      // Always create new broker ledger entry
      let brokerBalance = 0;
      const brokerBalanceQuery = await client.query(
        'SELECT balance FROM ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['broker_brokerage']
      );
      if (brokerBalanceQuery.rows.length > 0) {
        brokerBalance = Number(brokerBalanceQuery.rows[0].balance) || 0;
      }
      brokerBalance += totalBrokerageAllClients;

      // Create new broker ledger entry
      const brokerLedgerResult = await client.query(
        'INSERT INTO ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `Brokerage - Bill ${brokerBillNumber} (${Object.keys(clientGroups).length} clients, ${allBrokerBillItems.length} trades)`,
          0,
          totalBrokerageAllClients,
          brokerBalance,
          'broker_brokerage',
          brokerBillId
        ]
      );
      results.brokerEntries.push(brokerLedgerResult.rows[0]);

      results.brokerBill = {
        billId: brokerBillId,
        billNumber: brokerBillNumber,
        brokerId: brokerIdGlobal,
        totalBrokerage: totalBrokerageAllClients,
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

// Stock Holdings API endpoints
app.get('/api/holdings', async (req, res) => {
  try {
    // Include all holdings, even zero quantity ones
    const result = await pool.query(`
      SELECT 
        h.*,
        p.party_code,
        p.name as party_name,
        c.company_code,
        c.name as company_name,
        c.nse_code
      FROM stock_holdings h
      LEFT JOIN party_master p ON h.party_id = p.id
      LEFT JOIN company_master c ON h.company_id = c.id
      ORDER BY h.quantity DESC, p.name, c.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching holdings:', error);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

app.get('/api/holdings/party/:partyId', async (req, res) => {
  try {
    const { partyId } = req.params;
    // Include all holdings, even zero quantity ones
    const result = await pool.query(`
      SELECT 
        h.*,
        c.company_code,
        c.name as company_name,
        c.nse_code
      FROM stock_holdings h
      LEFT JOIN company_master c ON h.company_id = c.id
      WHERE h.party_id = $1
      ORDER BY h.quantity DESC, c.name
    `, [partyId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching party holdings:', error);
    res.status(500).json({ error: 'Failed to fetch party holdings' });
  }
});

// Record broker payment
app.post('/api/bills/:billId/payment', async (req, res) => {
  const client = await pool.connect();
  try {
    const { billId } = req.params;
    const { amount, payment_date, payment_method, reference_number, notes } = req.body;

    await client.query('BEGIN');

    // Get bill details
    const billResult = await client.query('SELECT * FROM bills WHERE id = $1', [billId]);
    if (billResult.rows.length === 0) {
      throw new Error('Bill not found');
    }
    const bill = billResult.rows[0];

    // Generate payment number
    const now = new Date();
    const paymentNumber = `PAY${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    // Insert payment record
    await client.query(
      'INSERT INTO payments (payment_number, party_id, bill_id, payment_date, amount, payment_method, reference_number, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [paymentNumber, bill.party_id, billId, payment_date, amount, payment_method, reference_number, notes]
    );

    // Update bill paid amount and status
    const newPaidAmount = Number(bill.paid_amount) + Number(amount);
    const newStatus = newPaidAmount >= Number(bill.total_amount) ? 'paid' : 'partial';
    
    await client.query(
      'UPDATE bills SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [newPaidAmount, newStatus, billId]
    );

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Payment recorded successfully',
      paymentNumber,
      newPaidAmount,
      newStatus
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment', details: error.message });
  } finally {
    client.release();
  }
});

// Nuclear reset endpoint - DELETES ALL DATA
app.post('/api/nuclear-reset', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔥 NUCLEAR RESET INITIATED - Deleting all data...');
    
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
      console.log(`  ✓ Cleared ${table}`);
    }
    
    await client.query('COMMIT');
    console.log('💥 NUCLEAR RESET COMPLETE - All data deleted');
    
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

// Process F&O trades and create ledger entries, positions, and bills
app.post('/api/fo/trades/process', async (req, res) => {
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

    // Collect all bill items for broker bill
    const allBrokerBillItems = [];
    let totalBrokerageAllClients = 0;
    let brokerIdGlobal = null;

    // Group trades by client
    const clientGroups = {};
    for (const trade of trades) {
      const clientId = (trade.ClientId || trade.clientId || '').toString().trim().toUpperCase();
      if (!clientId) continue;
      
      if (!clientGroups[clientId]) clientGroups[clientId] = [];
      clientGroups[clientId].push(trade);
    }

    const now = new Date();
    const billDateStr = billDate || now.toISOString().slice(0, 10);

    // Process each client
    for (const [clientId, clientTrades] of Object.entries(clientGroups)) {
      // Get party details
      const partyQuery = await client.query(
        'SELECT id, party_code, name, trading_slab, delivery_slab FROM fo_party_master WHERE UPPER(party_code) = $1',
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
        const symbol = (trade.Symbol || trade.symbol || '').toString().toUpperCase();
        const instrumentType = (trade.InstrumentType || trade.instrumentType || 'FUT').toString().toUpperCase();
        const expiryDate = trade.ExpiryDate || trade.expiryDate || '';
        const strikePrice = Number(trade.StrikePrice || trade.strikePrice || 0);
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
        if (instrumentType === 'FUT') {
          instrumentQuery = await client.query(
            'SELECT * FROM fo_instrument_master WHERE UPPER(symbol) = $1 AND instrument_type = $2 AND expiry_date = $3 AND is_active = true',
            [symbol, 'FUT', expiryDate]
          );
        } else if (instrumentType === 'CE' || instrumentType === 'PE') {
          instrumentQuery = await client.query(
            'SELECT * FROM fo_instrument_master WHERE UPPER(symbol) = $1 AND instrument_type = $2 AND expiry_date = $3 AND strike_price = $4 AND is_active = true',
            [symbol, instrumentType, expiryDate, strikePrice]
          );
        }
        
        if (instrumentQuery && instrumentQuery.rows.length > 0) {
          instrument = instrumentQuery.rows[0];
          lotSize = Number(instrument.lot_size) || 1;
        } else {
          // Auto-create instrument if not found
          console.log(`Auto-creating F&O instrument: ${symbol} ${instrumentType}`);
          const newInstrumentResult = await client.query(
            `INSERT INTO fo_instrument_master 
              (symbol, instrument_type, expiry_date, strike_price, lot_size, segment, underlying_asset, display_name, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [
              symbol,
              instrumentType,
              expiryDate || null,
              strikePrice || null,
              lotSize, // Default lot size
              'NFO',
              symbol,
              `${symbol} ${instrumentType} ${expiryDate}${strikePrice ? ' ' + strikePrice : ''}`,
              true
            ]
          );
          instrument = newInstrumentResult.rows[0];
        }

        // Calculate actual quantity (lots * lot size)
        const actualQuantity = lotQuantity * lotSize;
        const amount = actualQuantity * price;
        
        // Calculate brokerage (based on contract value)
        const brokerageRate = type === 'T' ? Number(party.trading_slab) : Number(party.delivery_slab);
        const brokerageAmount = (amount * brokerageRate) / 100;
        totalBrokerage += brokerageAmount;

        // Track buy/sell amounts
        if (side === 'BUY') {
          totalBuyAmount += amount;
        } else if (side === 'SELL') {
          totalSellAmount += amount;
        }

        // Create F&O contract entry
        const contractResult = await client.query(
          `INSERT INTO fo_contracts 
            (party_id, instrument_id, trade_date, trade_type, quantity, price, amount, lot_size, brokerage_amount) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING *`,
          [
            party.id,
            instrument.id,
            billDateStr,
            side,
            actualQuantity,
            price,
            amount,
            lotSize,
            brokerageAmount
          ]
        );

        // Update F&O position
        const positionQuery = await client.query(
          'SELECT * FROM fo_positions WHERE party_id = $1 AND instrument_id = $2 AND status = $3',
          [party.id, instrument.id, 'open']
        );

        if (positionQuery.rows.length > 0) {
          // Update existing position
          const position = positionQuery.rows[0];
          const currentQty = Number(position.quantity);
          const currentAvgPrice = Number(position.avg_price);
          const currentTotalInvested = currentQty * currentAvgPrice;
          
          let newQty, newAvgPrice;
          
          if (side === 'BUY') {
            // Long position
            newQty = currentQty + actualQuantity;
            const newTotalInvested = currentTotalInvested + amount;
            newAvgPrice = newQty !== 0 ? newTotalInvested / newQty : price;
          } else {
            // Short or reducing position
            newQty = currentQty - actualQuantity;
            newAvgPrice = currentAvgPrice; // Keep same avg price when selling
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

        billItems.push({
          description: `${instrument.display_name || symbol} - ${side}`,
          quantity: actualQuantity,
          rate: price,
          amount,
          lot_size: lotSize,
          client_code: clientId,
          instrument_id: instrument.id,
          brokerage_rate_pct: brokerageRate,
          brokerage_amount: brokerageAmount,
          trade_type: type,
        });
      }

      // Calculate net trade settlement
      const netTradeAmount = totalBuyAmount - totalSellAmount;
      const finalClientBalance = netTradeAmount + totalBrokerage;

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
      const billNumber = `FO-PTY${y}${m}${d}-${suffix}`;

      const billResult = await client.query(
        'INSERT INTO fo_bills (bill_number, party_id, bill_date, total_amount, bill_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [billNumber, party.id, billDateStr, finalClientBalance, 'party', 'pending']
      );

      const billId = billResult.rows[0].id;

      // Create ledger entry
      const debitAmount = finalClientBalance > 0 ? finalClientBalance : 0;
      const creditAmount = finalClientBalance < 0 ? Math.abs(finalClientBalance) : 0;
      
      const consolidatedLedgerResult = await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          party.id,
          billDateStr,
          `F&O Bill ${billNumber} - Buy: ₹${totalBuyAmount.toFixed(2)}, Sell: ₹${totalSellAmount.toFixed(2)}, Brokerage: ₹${totalBrokerage.toFixed(2)} (${clientTrades.length} trades)`,
          debitAmount,
          creditAmount,
          newClientBalance,
          'client_settlement',
          billId
        ]
      );
      results.ledgerEntries.push(consolidatedLedgerResult.rows[0]);

      // Track broker
      if (!brokerIdGlobal) {
        brokerIdGlobal = (clientTrades[0].brokerid || clientTrades[0].brokerId || 'BROKER').toString().toUpperCase();
      }
      
      // Get broker details
      let brokerShareTotal = 0;
      const brokerQuery = await client.query(
        'SELECT id, broker_code, name, trading_slab, delivery_slab FROM fo_broker_master WHERE UPPER(broker_code) = $1',
        [brokerIdGlobal]
      );
      
      if (brokerQuery.rows.length > 0) {
        const broker = brokerQuery.rows[0];
        
        for (const item of billItems) {
          const brokerRate = item.trade_type === 'T' ? Number(broker.trading_slab) : Number(broker.delivery_slab);
          const brokerShare = (item.amount * brokerRate) / 100;
          brokerShareTotal += brokerShare;
          item.broker_share = brokerShare;
        }
      }
      
      allBrokerBillItems.push(...billItems);
      totalBrokerageAllClients += totalBrokerage;

      // Insert F&O bill items
      for (const item of billItems) {
        await client.query(
          'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, lot_size, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [
            billId,
            item.description,
            item.quantity,
            item.rate,
            item.amount,
            item.lot_size,
            item.client_code,
            item.instrument_id,
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

    // Create broker bill
    if (allBrokerBillItems.length > 0 && brokerIdGlobal) {
      const clientList = Object.keys(clientGroups).join(', ');
      
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const brokerBillNumber = `FO-BRK${y}${m}${d}-${Math.floor(Math.random() * 900) + 100}`;
      
      const brokerBillResult = await client.query(
        'INSERT INTO fo_bills (bill_number, party_id, broker_id, broker_code, bill_date, total_amount, bill_type, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          brokerBillNumber,
          null,
          null,
          brokerIdGlobal,
          billDateStr,
          totalBrokerageAllClients,
          'broker',
          'pending',
          `F&O Brokerage from clients: ${clientList} - ${allBrokerBillItems.length} trades`
        ]
      );
      const brokerBillId = brokerBillResult.rows[0].id;
      
      // Insert broker bill items
      for (const item of allBrokerBillItems) {
        await client.query(
          'INSERT INTO fo_bill_items (bill_id, description, quantity, rate, amount, lot_size, client_code, instrument_id, brokerage_rate_pct, brokerage_amount, trade_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [
            brokerBillId,
            item.description,
            item.quantity,
            item.rate,
            item.amount,
            item.lot_size,
            item.client_code,
            item.instrument_id,
            item.brokerage_rate_pct,
            item.brokerage_amount,
            item.trade_type,
          ]
        );
      }

      // Create broker ledger entry
      let brokerBalance = 0;
      const brokerBalanceQuery = await client.query(
        'SELECT balance FROM fo_ledger_entries WHERE party_id IS NULL AND reference_type = $1 ORDER BY entry_date DESC, created_at DESC LIMIT 1',
        ['broker_brokerage']
      );
      if (brokerBalanceQuery.rows.length > 0) {
        brokerBalance = Number(brokerBalanceQuery.rows[0].balance) || 0;
      }
      brokerBalance += totalBrokerageAllClients;

      const brokerLedgerResult = await client.query(
        'INSERT INTO fo_ledger_entries (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          null,
          billDateStr,
          `F&O Brokerage - Bill ${brokerBillNumber} (${Object.keys(clientGroups).length} clients, ${allBrokerBillItems.length} trades)`,
          0,
          totalBrokerageAllClients,
          brokerBalance,
          'broker_brokerage',
          brokerBillId
        ]
      );
      results.brokerEntries.push(brokerLedgerResult.rows[0]);
    }

    await client.query('COMMIT');
    res.json(results);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing F&O trades:', error);
    res.status(500).json({ error: 'Failed to process F&O trades', details: error.message });
  } finally {
    client.release();
  }
});

// ========================================
// F&O PARTY MASTER APIs
// ========================================

// Get all F&O parties
app.get('/api/fo/parties', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fo_party_master ORDER BY created_at DESC');
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O parties:', error);
    res.status(500).json({ error: 'Failed to fetch F&O parties' });
  }
});

// Create F&O party
app.post('/api/fo/parties', async (req, res) => {
  try {
    const { party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'INSERT INTO fo_party_master (party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating F&O party:', error);
    res.status(500).json({ error: 'Failed to create F&O party' });
  }
});

// Update F&O party
app.put('/api/fo/parties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'UPDATE fo_party_master SET party_code = $1, name = $2, nse_code = $3, ref_code = $4, address = $5, city = $6, phone = $7, trading_slab = $8, delivery_slab = $9, updated_at = NOW() WHERE id = $10 RETURNING *',
      [party_code, name, nse_code, ref_code, address, city, phone, trading_slab, delivery_slab, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating F&O party:', error);
    res.status(500).json({ error: 'Failed to update F&O party' });
  }
});

// Delete F&O party
app.delete('/api/fo/parties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fo_party_master WHERE id = $1', [id]);
    res.json({ message: 'F&O party deleted successfully' });
  } catch (error) {
    console.error('Error deleting F&O party:', error);
    res.status(500).json({ error: 'Failed to delete F&O party' });
  }
});

// ========================================
// F&O BROKER MASTER APIs
// ========================================

// Get all F&O brokers
app.get('/api/fo/brokers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fo_broker_master ORDER BY created_at DESC');
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching F&O brokers:', error);
    res.status(500).json({ error: 'Failed to fetch F&O brokers' });
  }
});

// Create F&O broker
app.post('/api/fo/brokers', async (req, res) => {
  try {
    const { broker_code, name, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'INSERT INTO fo_broker_master (broker_code, name, address, city, phone, trading_slab, delivery_slab) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [broker_code, name, address, city, phone, trading_slab, delivery_slab]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating F&O broker:', error);
    res.status(500).json({ error: 'Failed to create F&O broker' });
  }
});

// Update F&O broker
app.put('/api/fo/brokers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { broker_code, name, address, city, phone, trading_slab, delivery_slab } = req.body;
    const result = await pool.query(
      'UPDATE fo_broker_master SET broker_code = $1, name = $2, address = $3, city = $4, phone = $5, trading_slab = $6, delivery_slab = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [broker_code, name, address, city, phone, trading_slab, delivery_slab, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating F&O broker:', error);
    res.status(500).json({ error: 'Failed to update F&O broker' });
  }
});

// Delete F&O broker
app.delete('/api/fo/brokers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fo_broker_master WHERE id = $1', [id]);
    res.json({ message: 'F&O broker deleted successfully' });
  } catch (error) {
    console.error('Error deleting F&O broker:', error);
    res.status(500).json({ error: 'Failed to delete F&O broker' });
  }
});

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
             i.symbol, i.instrument_type, i.expiry_date, i.strike_price, i.display_name, i.lot_size,
             b.broker_code, bm.name as broker_name
      FROM fo_contracts c
      LEFT JOIN fo_party_master p ON p.id = c.party_id
      LEFT JOIN fo_instrument_master i ON i.id = c.instrument_id
      LEFT JOIN fo_broker_master bm ON bm.id = c.broker_id
      LEFT JOIN fo_broker_master b ON b.id = c.broker_id
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
              i.symbol, i.instrument_type, i.expiry_date, i.strike_price, i.display_name, i.lot_size,
              bm.broker_code, bm.name as broker_name
       FROM fo_contracts c
       LEFT JOIN fo_party_master p ON p.id = c.party_id
       LEFT JOIN fo_instrument_master i ON i.id = c.instrument_id
       LEFT JOIN fo_broker_master bm ON bm.id = c.broker_id
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
      trade_date, trade_type, quantity, price, amount, lot_size,
      brokerage_rate, brokerage_amount, status, notes 
    } = req.body;
    
    // For CF (Carry Forward) trades, brokerage should be 0
    const finalBrokerageRate = trade_type === 'CF' ? 0 : brokerage_rate;
    const finalBrokerageAmount = trade_type === 'CF' ? 0 : brokerage_amount;
    
    const result = await pool.query(
      `INSERT INTO fo_contracts 
        (contract_number, party_id, instrument_id, broker_id, broker_code, trade_date, 
         trade_type, quantity, price, amount, lot_size, brokerage_rate, brokerage_amount, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING *`,
      [
        contract_number, party_id, instrument_id, broker_id, broker_code,
        trade_date, trade_type, quantity, price, amount, lot_size,
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
      trade_date, trade_type, quantity, price, amount, lot_size,
      brokerage_rate, brokerage_amount, status, notes 
    } = req.body;
    
    // For CF (Carry Forward) trades, brokerage should be 0
    const finalBrokerageRate = trade_type === 'CF' ? 0 : brokerage_rate;
    const finalBrokerageAmount = trade_type === 'CF' ? 0 : brokerage_amount;
    
    const result = await pool.query(
      `UPDATE fo_contracts 
       SET contract_number = $1, party_id = $2, instrument_id = $3, broker_id = $4, 
           broker_code = $5, trade_date = $6, trade_type = $7, quantity = $8, 
           price = $9, amount = $10, lot_size = $11, brokerage_rate = $12, brokerage_amount = $13, 
           status = $14, notes = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 
       RETURNING *`,
      [
        contract_number, party_id, instrument_id, broker_id, broker_code,
        trade_date, trade_type, quantity, price, amount, lot_size,
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
          // Create contract
          const contractResult = await client.query(
            `INSERT INTO fo_contracts 
              (party_id, instrument_id, broker_id, broker_code, trade_date, trade_type, 
               quantity, price, amount, lot_size, brokerage_rate, brokerage_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
             RETURNING *`,
            [
              contract.party_id, contract.instrument_id, contract.broker_id, 
              contract.broker_code, contract.trade_date, contract.trade_type,
              contract.quantity, contract.price, contract.amount, contract.lot_size,
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

          billItems.push({
            contract_id: contractResult.rows[0].id,
            instrument_id: contract.instrument_id,
            description: `${instrument.display_name} - BUY`,
            quantity: contract.quantity,
            rate: contract.price,
            amount: contract.amount,
            lot_size: contract.lot_size,
            brokerage_rate_pct: contract.brokerage_rate,
            brokerage_amount: contract.brokerage_amount,
            trade_type: 'T',
          });
        }

        // Get party details
        const partyResult = await client.query(
          'SELECT * FROM fo_party_master WHERE id = $1',
          [partyId]
        );
        const party = partyResult.rows[0];

        // Create party bill
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const suffix = String(Math.floor(Math.random() * 900) + 100);
        const billNumber = `FO-PTY${y}${m}${d}-${suffix}`;

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
               lot_size, brokerage_rate_pct, brokerage_amount, trade_type) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              billId, item.contract_id, item.instrument_id, item.description,
              item.quantity, item.rate, item.amount, item.lot_size,
              item.brokerage_rate_pct, item.brokerage_amount, item.trade_type
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
        const newBalance = balance + finalBillAmount;

        await client.query(
          `INSERT INTO fo_ledger_entries 
            (party_id, entry_date, particulars, debit_amount, credit_amount, balance, reference_type, reference_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            partyId, billDateStr,
            `F&O Bill ${billNumber} - BUY trades`,
            finalBillAmount, 0, newBalance, 'client_settlement', billId
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
        const brokerBillNumber = `FO-BRK${y}${m}${d}-${Math.floor(Math.random() * 900) + 100}`;

        const brokerBillResult = await client.query(
          `INSERT INTO fo_bills 
            (bill_number, broker_id, bill_date, total_amount, brokerage_amount, bill_type, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [brokerBillNumber, brokerId, billDateStr, totalBrokerBrokerage, totalBrokerBrokerage, 'broker', 'pending']
        );
        brokerBills.push(brokerBillResult.rows[0]);
      }
    } else {
      // Just create contracts without bills
      for (const contract of contracts) {
        const contractResult = await client.query(
          `INSERT INTO fo_contracts 
            (party_id, instrument_id, broker_id, broker_code, trade_date, trade_type, 
             quantity, price, amount, lot_size, brokerage_rate, brokerage_amount, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
           RETURNING *`,
          [
            contract.party_id, contract.instrument_id, contract.broker_id, 
            contract.broker_code, contract.trade_date, contract.trade_type,
            contract.quantity, contract.price, contract.amount, contract.lot_size,
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
// F&O DASHBOARD APIs
// ========================================

// Get F&O dashboard statistics
app.get('/api/fo/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM fo_bills WHERE bill_type = 'party') as total_bills,
        (SELECT COUNT(*) FROM fo_positions WHERE status = 'open') as open_positions,
        (SELECT COUNT(*) FROM fo_contracts) as total_contracts,
        (SELECT COUNT(DISTINCT party_id) FROM fo_contracts) as active_parties,
        (SELECT COALESCE(SUM(total_amount), 0) FROM fo_bills WHERE status = 'pending' AND bill_type = 'party') as pending_amount,
        (SELECT COALESCE(SUM(total_amount), 0) FROM fo_bills WHERE bill_type = 'party') as total_billed
    `);
    res.json(stats.rows[0] || {});
  } catch (error) {
    console.error('Error fetching F&O dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch F&O dashboard stats' });
  }
});

// Get F&O positions (holdings)
app.get('/api/fo/positions', async (req, res) => {
  try {
    const { party_id } = req.query;
    
    let query = `
      SELECT p.*, i.symbol, i.instrument_type, i.expiry_date, i.strike_price, 
             i.display_name, i.lot_size, pm.party_code, pm.name as party_name
      FROM fo_positions p
      LEFT JOIN fo_instrument_master i ON i.id = p.instrument_id
      LEFT JOIN fo_party_master pm ON pm.id = p.party_id
      WHERE p.status = 'open'
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
        LEFT JOIN fo_broker_master bm ON bm.broker_code = b.broker_code
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
      LEFT JOIN fo_party_master p ON p.id = b.party_id
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
       LEFT JOIN fo_party_master p ON p.id = b.party_id
       LEFT JOIN fo_broker_master bm ON bm.broker_code = b.broker_code
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
      SELECT l.*, p.party_code, p.name AS party_name
      FROM fo_ledger_entries l
      LEFT JOIN fo_party_master p ON p.id = l.party_id
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
      `SELECT l.*, p.party_code, p.name AS party_name
       FROM fo_ledger_entries l
       LEFT JOIN fo_party_master p ON p.id = l.party_id
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

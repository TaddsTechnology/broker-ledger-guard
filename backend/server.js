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
      'SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC',
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
        await client.query(
          'INSERT INTO bill_items (bill_id, description, quantity, rate, amount, brokerage_rate_pct, brokerage_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            bill.id,
            `Contract ${contract.contract_number} - ${contract.contract_type.toUpperCase()}`,
            contract.quantity,
            contract.rate,
            contract.amount,
            contract.brokerage_rate,
            contract.brokerage_amount
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
        await client.query(
          'INSERT INTO bill_items (bill_id, description, quantity, rate, amount, brokerage_rate_pct, brokerage_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            brokerBill.id,
            `Contract ${contract.contract_number} - Brokerage`,
            contract.quantity,
            contract.rate,
            contract.amount,
            contract.brokerage_rate,
            contract.brokerage_amount
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

      const insertItem = `INSERT INTO bill_items (bill_id, description, quantity, rate, amount, client_code, company_code, brokerage_rate_pct, brokerage_amount)
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
      for (const it of items) {
        await client.query(insertItem, [
          billId,
          it.securityName || `${it.company_code || ''}`,
          Number(it.quantity) || 0,
          Number(it.price) || 0,
          Number(it.amount) || 0,
          (it.clientId || '').toString().trim().toUpperCase(),
          (it.company_code || null),
          Number(it.brokerage_rate_pct) || 0,
          Number(it.brokerage_amount) || 0,
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
      totalBrokerageAllClients += brokerShareTotal; // Only broker's share, not total

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

      // Create contracts for all trades (both T and D) to update stock holdings
      for (const item of billItems) {
        // Create contracts for both trading (T) and delivery (D) trades

        // Get company_id from company_code (required for stock holdings)
        let company_id = null;
        if (item.company_code) {
          const companyQuery = await client.query(
            'SELECT id FROM company_master WHERE UPPER(company_code) = $1',
            [item.company_code.toUpperCase()]
          );
          if (companyQuery.rows.length > 0) {
            company_id = companyQuery.rows[0].id;
          }
        }

        // Generate sequential contract number
        const countQuery = await client.query(
          'SELECT COUNT(*) as count FROM contracts'
        );
        const nextNumber = (parseInt(countQuery.rows[0].count) || 0) + 1;
        const contract_number = String(nextNumber).padStart(3, '0');
        
        // Determine contract_type from description (BUY or SELL)
        const contract_type = item.description.toUpperCase().includes('BUY') ? 'buy' : 'sell';

        // Only create contract if company exists in company_master
        // The database trigger will automatically update stock_holdings
        if (company_id) {
          await client.query(
            'INSERT INTO contracts (contract_number, party_id, settlement_id, broker_id, broker_code, contract_date, quantity, rate, amount, contract_type, brokerage_rate, brokerage_amount, status, company_id, trade_type, party_bill_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)',
            [
              contract_number,
              party.id,
              null, // settlement_id not available from CSV
              null, // broker_id
              brokerIdGlobal,
              billDateStr,
              item.quantity,
              item.rate,
              item.amount,
              contract_type,
              item.brokerage_rate_pct,
              item.brokerage_amount,
              'active',
              company_id,
              item.trade_type,
              billId
            ]
          );
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
      
      // Insert all broker bill items
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
            item.brokerage_rate_pct,
            item.brokerage_amount,
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

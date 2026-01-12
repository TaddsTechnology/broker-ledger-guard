-- F&O (Futures & Options) Database Schema
-- NOTE: F&O shares party_master and broker_master with Equity (not separate tables)
-- This creates a unified client/broker management system across both modules

-- ============================================================================
-- F&O INSTRUMENT MASTER
-- ============================================================================
-- Stores F&O instruments (Futures, Call Options, Put Options)
CREATE TABLE IF NOT EXISTS fo_instrument_master (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,                    -- e.g., NIFTY, BANKNIFTY, RELIANCE
  instrument_type VARCHAR(10) NOT NULL,           -- 'FUT' (Futures), 'CE' (Call), 'PE' (Put)
  expiry_date DATE NOT NULL,                      -- Contract expiry date
  strike_price DECIMAL(10, 2),                    -- Strike price (NULL for futures)
  lot_size INTEGER NOT NULL,                      -- Standard lot size (e.g., 50 for NIFTY)
  segment VARCHAR(20) DEFAULT 'NFO',              -- Trading segment (NFO, BFO, CDS, MCX)
  underlying_asset VARCHAR(50),                   -- Underlying asset name
  tick_size DECIMAL(10, 2) DEFAULT 0.05,          -- Minimum price movement
  display_name VARCHAR(100),                      -- Human-readable name
  is_active BOOLEAN DEFAULT true,                 -- Active/Expired
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, instrument_type, expiry_date, strike_price)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fo_instrument_symbol ON fo_instrument_master(symbol);
CREATE INDEX IF NOT EXISTS idx_fo_instrument_expiry ON fo_instrument_master(expiry_date);
CREATE INDEX IF NOT EXISTS idx_fo_instrument_active ON fo_instrument_master(is_active);

-- ============================================================================
-- F&O CONTRACTS/TRADES
-- ============================================================================
-- Stores individual F&O trades
CREATE TABLE IF NOT EXISTS fo_contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(50) UNIQUE,
  party_id UUID REFERENCES party_master(id) ON DELETE CASCADE,
  instrument_id INTEGER REFERENCES fo_instrument_master(id),
  broker_id UUID REFERENCES broker_master(id) ON DELETE SET NULL,
  broker_code VARCHAR(50),
  broker_bill_id INTEGER REFERENCES fo_bills(id) ON DELETE SET NULL,  -- Link to broker bill
  trade_date DATE NOT NULL,                       -- Trade date
  trade_type VARCHAR(10) NOT NULL,                -- 'T' (Trading) or 'D' (Delivery)
  side VARCHAR(10),                               -- 'BUY' or 'SELL' (actual trade direction)
  quantity INTEGER NOT NULL,                      -- Actual quantity
  price DECIMAL(10, 2) NOT NULL,                  -- Price per unit
  amount DECIMAL(15, 2) NOT NULL,                 -- quantity * price
  brokerage_rate DECIMAL(5, 2),                   -- Brokerage percentage or flat
  brokerage_amount DECIMAL(10, 2),                -- Total brokerage charged
  status VARCHAR(20) DEFAULT 'open',              -- 'open', 'closed', 'expired', 'squared_off'
  settlement_id INTEGER,                          -- Can reference settlement if needed
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fo_contracts_party ON fo_contracts(party_id);
CREATE INDEX IF NOT EXISTS idx_fo_contracts_date ON fo_contracts(trade_date);
CREATE INDEX IF NOT EXISTS idx_fo_contracts_status ON fo_contracts(status);
CREATE INDEX IF NOT EXISTS idx_fo_contracts_instrument ON fo_contracts(instrument_id);
CREATE INDEX IF NOT EXISTS idx_fo_contracts_broker_bill ON fo_contracts(broker_bill_id);

-- Add constraint and index for the side column
ALTER TABLE fo_contracts ADD CONSTRAINT chk_side CHECK (side IN ('BUY', 'SELL'));
CREATE INDEX IF NOT EXISTS idx_fo_contracts_side ON fo_contracts(side);

-- ============================================================================
-- F&O POSITIONS
-- ============================================================================
-- Tracks current open positions for each party
CREATE TABLE IF NOT EXISTS fo_positions (
  id SERIAL PRIMARY KEY,
  party_id UUID REFERENCES party_master(id) ON DELETE CASCADE,
  instrument_id INTEGER REFERENCES fo_instrument_master(id),
  quantity INTEGER NOT NULL DEFAULT 0,            -- Net position (positive=long, negative=short)
  avg_price DECIMAL(10, 2),                       -- Average entry price
  realized_pnl DECIMAL(15, 2) DEFAULT 0,          -- Realized profit/loss
  unrealized_pnl DECIMAL(15, 2) DEFAULT 0,        -- Unrealized MTM P&L
  last_trade_date DATE,                           -- Last transaction date
  last_mtm_date DATE,                             -- Last MTM calculation date
  last_mtm_price DECIMAL(10, 2),                  -- Last marked-to-market price
  status VARCHAR(20) DEFAULT 'open',              -- 'open' or 'closed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(party_id, instrument_id)
);

CREATE INDEX IF NOT EXISTS idx_fo_positions_party ON fo_positions(party_id);
CREATE INDEX IF NOT EXISTS idx_fo_positions_instrument ON fo_positions(instrument_id);

-- ============================================================================
-- F&O MTM (MARK-TO-MARKET) HISTORY
-- ============================================================================
-- Stores daily MTM calculations
CREATE TABLE IF NOT EXISTS fo_mtm_history (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES fo_positions(id) ON DELETE CASCADE,
  party_id UUID REFERENCES party_master(id) ON DELETE CASCADE,
  instrument_id INTEGER REFERENCES fo_instrument_master(id),
  mtm_date DATE NOT NULL,                         -- MTM calculation date
  opening_quantity INTEGER,                       -- Opening position
  closing_quantity INTEGER,                       -- Closing position
  mtm_price DECIMAL(10, 2) NOT NULL,             -- Market price used for MTM
  avg_price DECIMAL(10, 2),                      -- Average entry price
  mtm_pnl DECIMAL(15, 2) NOT NULL,               -- MTM profit/loss
  realized_pnl DECIMAL(15, 2) DEFAULT 0,         -- Realized P&L for the day
  total_pnl DECIMAL(15, 2) NOT NULL,             -- Total P&L (MTM + Realized)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fo_mtm_date ON fo_mtm_history(mtm_date);
CREATE INDEX IF NOT EXISTS idx_fo_mtm_party ON fo_mtm_history(party_id);
CREATE INDEX IF NOT EXISTS idx_fo_mtm_position ON fo_mtm_history(position_id);

-- ============================================================================
-- F&O BILLS
-- ============================================================================
-- Bills specific to F&O trading
CREATE TABLE IF NOT EXISTS fo_bills (
  id SERIAL PRIMARY KEY,
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  party_id UUID REFERENCES party_master(id) ON DELETE SET NULL,
  broker_id UUID REFERENCES broker_master(id) ON DELETE SET NULL,
  broker_code VARCHAR(50),
  bill_date DATE NOT NULL,
  due_date DATE,
  bill_type VARCHAR(20) DEFAULT 'party',          -- 'party' or 'broker'
  total_amount DECIMAL(15, 2) NOT NULL,           -- Total bill amount
  brokerage_amount DECIMAL(15, 2) DEFAULT 0,      -- Total brokerage
  mtm_amount DECIMAL(15, 2) DEFAULT 0,            -- MTM component
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',           -- 'pending', 'partial', 'paid'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fo_bills_party ON fo_bills(party_id);
CREATE INDEX IF NOT EXISTS idx_fo_bills_date ON fo_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_fo_bills_type ON fo_bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_fo_bills_status ON fo_bills(status);

-- ============================================================================
-- F&O BILL ITEMS
-- ============================================================================
-- Line items for F&O bills
CREATE TABLE IF NOT EXISTS fo_bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER REFERENCES fo_bills(id) ON DELETE CASCADE,
  contract_id INTEGER REFERENCES fo_contracts(id),
  instrument_id INTEGER REFERENCES fo_instrument_master(id),
  description TEXT,
  quantity INTEGER,                               -- Actual quantity
  rate DECIMAL(10, 2),                           -- Price per unit
  amount DECIMAL(15, 2),                         -- Total transaction value
  client_code VARCHAR(50),                        -- Party/client code
  brokerage_rate_pct DECIMAL(5, 2),
  brokerage_amount DECIMAL(10, 2),
  trade_type VARCHAR(10),                         -- 'T' (Trading) or 'D' (Delivery)
  side VARCHAR(10),                               -- 'BUY' or 'SELL' (actual trade direction)
  mtm_amount DECIMAL(15, 2),                     -- MTM component if any
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fo_bill_items_bill ON fo_bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_fo_bill_items_contract ON fo_bill_items(contract_id);

-- Add constraint and index for the side column
ALTER TABLE fo_bill_items ADD CONSTRAINT chk_bill_item_side CHECK (side IN ('BUY', 'SELL'));
CREATE INDEX IF NOT EXISTS idx_fo_bill_items_side ON fo_bill_items(side);

-- ============================================================================
-- F&O LEDGER ENTRIES
-- ============================================================================
-- Ledger for F&O transactions (separate ledger, but uses Equity party_master)
CREATE TABLE IF NOT EXISTS fo_ledger_entries (
  id SERIAL PRIMARY KEY,
  party_id UUID REFERENCES party_master(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL,
  particulars TEXT NOT NULL,
  debit_amount DECIMAL(15, 2) DEFAULT 0,
  credit_amount DECIMAL(15, 2) DEFAULT 0,
  balance DECIMAL(15, 2) NOT NULL,
  reference_type VARCHAR(50),                     -- 'client_settlement', 'broker_brokerage', 'sub_broker_profit', 'payment', etc.
  reference_id UUID,                            -- ID of related record (UUID from cash_transactions)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fo_ledger_party ON fo_ledger_entries(party_id);
CREATE INDEX IF NOT EXISTS idx_fo_ledger_date ON fo_ledger_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_fo_ledger_type ON fo_ledger_entries(reference_type);
CREATE INDEX IF NOT EXISTS idx_fo_ledger_reference_id ON fo_ledger_entries(reference_id);

-- ============================================================================
-- F&O CASH TRANSACTIONS (optional, if you want separate FO cash table)
-- For now, FO cash uses shared cash_transactions + fo_ledger_entries in backend logic.

-- F&O PAYMENTS
-- ============================================================================
-- Payment tracking for F&O bills
CREATE TABLE IF NOT EXISTS fo_payments (
  id SERIAL PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  bill_id INTEGER REFERENCES fo_bills(id) ON DELETE SET NULL,
  party_id UUID REFERENCES party_master(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50),                     -- 'cash', 'cheque', 'bank_transfer', etc.
  payment_type VARCHAR(10) DEFAULT 'payin' CHECK (payment_type IN ('payin', 'payout')), -- 'payin' (party pays you) or 'payout' (you pay party)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fo_payments_bill ON fo_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_fo_payments_party ON fo_payments(party_id);
CREATE INDEX IF NOT EXISTS idx_fo_payments_date ON fo_payments(payment_date);

-- ============================================================================
-- F&O EXPIRY CALENDAR
-- ============================================================================
-- Pre-populated expiry dates for quick reference
CREATE TABLE IF NOT EXISTS fo_expiry_calendar (
  id SERIAL PRIMARY KEY,
  expiry_date DATE NOT NULL UNIQUE,
  expiry_type VARCHAR(20) NOT NULL,               -- 'monthly', 'weekly'
  month_year VARCHAR(10),                         -- 'JAN2025', 'FEB2025', etc.
  is_current BOOLEAN DEFAULT false,               -- Current active expiry
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fo_expiry_date ON fo_expiry_calendar(expiry_date);
CREATE INDEX IF NOT EXISTS idx_fo_expiry_current ON fo_expiry_calendar(is_current);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample F&O Instruments (NIFTY Futures and Options)
INSERT INTO fo_instrument_master (symbol, instrument_type, expiry_date, strike_price, lot_size, underlying_asset, display_name) VALUES
  ('NIFTY', 'FUT', '2025-01-30', NULL, 50, 'NIFTY 50', 'NIFTY 30JAN25 FUT'),
  ('NIFTY', 'CE', '2025-01-30', 24000.00, 50, 'NIFTY 50', 'NIFTY 30JAN25 24000 CE'),
  ('NIFTY', 'PE', '2025-01-30', 24000.00, 50, 'NIFTY 50', 'NIFTY 30JAN25 24000 PE'),
  ('NIFTY', 'CE', '2025-01-30', 24500.00, 50, 'NIFTY 50', 'NIFTY 30JAN25 24500 CE'),
  ('NIFTY', 'PE', '2025-01-30', 23500.00, 50, 'NIFTY 50', 'NIFTY 30JAN25 23500 PE'),
  ('BANKNIFTY', 'FUT', '2025-01-29', NULL, 25, 'BANK NIFTY', 'BANKNIFTY 29JAN25 FUT'),
  ('BANKNIFTY', 'CE', '2025-01-29', 52000.00, 25, 'BANK NIFTY', 'BANKNIFTY 29JAN25 52000 CE'),
  ('BANKNIFTY', 'PE', '2025-01-29', 52000.00, 25, 'BANK NIFTY', 'BANKNIFTY 29JAN25 52000 PE')
ON CONFLICT (symbol, instrument_type, expiry_date, strike_price) DO NOTHING;

-- Sample Expiry Calendar for 2025
INSERT INTO fo_expiry_calendar (expiry_date, expiry_type, month_year, is_current) VALUES
  ('2025-01-29', 'weekly', 'JAN2025', false),
  ('2025-01-30', 'monthly', 'JAN2025', true),
  ('2025-02-27', 'monthly', 'FEB2025', false),
  ('2025-03-27', 'monthly', 'MAR2025', false),
  ('2025-04-24', 'monthly', 'APR2025', false),
  ('2025-05-29', 'monthly', 'MAY2025', false)
ON CONFLICT (expiry_date) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- NOTE: party_master and broker_master are shared with Equity module (no separate fo_ versions)
COMMENT ON TABLE fo_instrument_master IS 'Master table for F&O instruments (Futures, Calls, Puts)';
COMMENT ON TABLE fo_contracts IS 'F&O trades - uses Equity party_master and broker_master (shared)';
COMMENT ON TABLE fo_positions IS 'F&O positions - uses Equity party_master (shared)';
COMMENT ON TABLE fo_mtm_history IS 'Daily mark-to-market P&L calculations - uses Equity party_master';
COMMENT ON TABLE fo_bills IS 'F&O bills - uses Equity party_master and broker_master (shared)';
COMMENT ON TABLE fo_bill_items IS 'Line items in F&O bills';
COMMENT ON TABLE fo_ledger_entries IS 'F&O ledger (separate from equity) - uses Equity party_master';
COMMENT ON TABLE fo_payments IS 'Payment tracking for F&O bills - uses Equity party_master';
COMMENT ON TABLE fo_expiry_calendar IS 'Pre-defined expiry dates for quick reference';

COMMENT ON COLUMN fo_instrument_master.instrument_type IS 'FUT=Futures, CE=Call European, PE=Put European';
COMMENT ON COLUMN fo_instrument_master.lot_size IS 'Standard lot size for the instrument';
COMMENT ON COLUMN fo_contracts.trade_type IS 'BUY (bill + brokerage), SELL (bill + brokerage), CF (Carry Forward - NO bill, NO brokerage, just rollover tracking)';
COMMENT ON COLUMN fo_contracts.status IS 'open, closed, expired, squared_off';
COMMENT ON COLUMN fo_positions.quantity IS 'Net position: positive=long, negative=short';
COMMENT ON COLUMN fo_positions.unrealized_pnl IS 'MTM profit/loss on open positions';
COMMENT ON COLUMN fo_mtm_history.mtm_price IS 'Market price used for MTM calculation';

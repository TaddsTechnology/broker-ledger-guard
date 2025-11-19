-- Broker ERP Database Schema
-- PostgreSQL Database Setup

-- Create database if not exists (run this separately in psql or pgAdmin)
-- CREATE DATABASE broker_erp;

-- Connect to the broker_erp database and run the following:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create party_master table
CREATE TABLE IF NOT EXISTS party_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_code VARCHAR(50) UNIQUE NOT NULL,
    nse_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    ref_code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    trading_slab DECIMAL(5,2) DEFAULT 0.00,
    delivery_slab DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create broker_master table
CREATE TABLE IF NOT EXISTS broker_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    trading_slab DECIMAL(5,2) DEFAULT 0.00,
    delivery_slab DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create company_master table
CREATE TABLE IF NOT EXISTS company_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    nse_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create settlement_master table
CREATE TABLE IF NOT EXISTS settlement_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(10) CHECK (type IN ('nse', 'fo', 'bse', 'mcx')) NOT NULL,
    settlement_number VARCHAR(50) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    contract_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trade_files table (for the TXT to Excel feature)
CREATE TABLE IF NOT EXISTS trade_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded',
    rows_processed INTEGER DEFAULT 0,
    error_message TEXT,
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create trade_data table (stores processed trade file data)
CREATE TABLE IF NOT EXISTS trade_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_file_id UUID REFERENCES trade_files(id) ON DELETE CASCADE,
    party_code VARCHAR(50),
    company_code VARCHAR(50),
    settlement_id UUID REFERENCES settlement_master(id),
    trade_date DATE,
    quantity INTEGER,
    price DECIMAL(10,2),
    amount DECIMAL(15,2),
    trade_type VARCHAR(10) CHECK (trade_type IN ('buy', 'sell')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    party_id UUID REFERENCES party_master(id),
    broker_id UUID REFERENCES broker_master(id),
    broker_code VARCHAR(50),
    bill_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    bill_type VARCHAR(10) DEFAULT 'party' CHECK (bill_type IN ('party', 'broker')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    client_code VARCHAR(50),
    company_code VARCHAR(50),
    brokerage_rate_pct DECIMAL(5,2) DEFAULT 0.00,
    brokerage_amount DECIMAL(15,2) DEFAULT 0.00,
    trade_type VARCHAR(1) CHECK (trade_type IN ('D', 'T')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    party_id UUID REFERENCES party_master(id),
    bill_id UUID REFERENCES bills(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint for idempotency
ALTER TABLE payments ADD CONSTRAINT unique_payment_id UNIQUE (id);

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID REFERENCES party_master(id),
    entry_date DATE NOT NULL,
    particulars VARCHAR(255) NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    balance DECIMAL(15,2) NOT NULL,
    reference_type VARCHAR(50), -- 'bill', 'payment', 'adjustment'
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns for payment linking
ALTER TABLE ledger_entries ADD COLUMN linked_payment_id UUID REFERENCES payments(id);
ALTER TABLE ledger_entries ADD COLUMN account_type VARCHAR(20) DEFAULT 'party'; -- 'party', 'bank'
ALTER TABLE ledger_entries ADD COLUMN account_id VARCHAR(50); -- party_code or bank identifier

-- Create application_settings table
CREATE TABLE IF NOT EXISTS application_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_party_master_party_code ON party_master(party_code);
CREATE INDEX IF NOT EXISTS idx_party_master_name ON party_master(name);
CREATE INDEX IF NOT EXISTS idx_company_master_company_code ON company_master(company_code);
CREATE INDEX IF NOT EXISTS idx_settlement_master_settlement_number ON settlement_master(settlement_number);
CREATE INDEX IF NOT EXISTS idx_settlement_master_type ON settlement_master(type);
CREATE INDEX IF NOT EXISTS idx_trade_data_party_code ON trade_data(party_code);
CREATE INDEX IF NOT EXISTS idx_trade_data_company_code ON trade_data(company_code);
CREATE INDEX IF NOT EXISTS idx_trade_data_trade_date ON trade_data(trade_date);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_party_id ON bills(party_id);
CREATE INDEX IF NOT EXISTS idx_bills_broker_id ON bills(broker_id);
CREATE INDEX IF NOT EXISTS idx_bills_broker_code ON bills(broker_code);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_payments_party_id ON payments(party_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_party_id ON ledger_entries(party_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entry_date ON ledger_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference_type ON ledger_entries(reference_type);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ledger_entries_linked_payment_id ON ledger_entries(linked_payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_type ON ledger_entries(account_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id ON ledger_entries(account_id);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    party_id UUID REFERENCES party_master(id),
    settlement_id UUID REFERENCES settlement_master(id),
    broker_id UUID REFERENCES broker_master(id),
    broker_code VARCHAR(50),
    company_id UUID REFERENCES company_master(id),
    trade_type VARCHAR(1) CHECK (trade_type IN ('D', 'T')),
    contract_date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    contract_type VARCHAR(10) CHECK (contract_type IN ('buy', 'sell')) NOT NULL,
    brokerage_rate DECIMAL(5,2) DEFAULT 0.00,
    brokerage_amount DECIMAL(15,2) DEFAULT 0.00,
    bill_generated BOOLEAN DEFAULT FALSE,
    party_bill_id UUID REFERENCES bills(id),
    broker_bill_id UUID REFERENCES bills(id),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_holdings table
CREATE TABLE IF NOT EXISTS stock_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID REFERENCES party_master(id) NOT NULL,
    company_id UUID REFERENCES company_master(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    avg_buy_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_invested DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    last_trade_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per party-company combination
    UNIQUE(party_id, company_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_party_master_party_code ON party_master(party_code);
CREATE INDEX IF NOT EXISTS idx_party_master_name ON party_master(name);
CREATE INDEX IF NOT EXISTS idx_company_master_company_code ON company_master(company_code);
CREATE INDEX IF NOT EXISTS idx_settlement_master_settlement_number ON settlement_master(settlement_number);
CREATE INDEX IF NOT EXISTS idx_settlement_master_type ON settlement_master(type);
CREATE INDEX IF NOT EXISTS idx_trade_data_party_code ON trade_data(party_code);
CREATE INDEX IF NOT EXISTS idx_trade_data_company_code ON trade_data(company_code);
CREATE INDEX IF NOT EXISTS idx_trade_data_trade_date ON trade_data(trade_date);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_party_id ON bills(party_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_payments_party_id ON payments(party_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_party_id ON ledger_entries(party_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entry_date ON ledger_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference_type ON ledger_entries(reference_type);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_party_id ON contracts(party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_settlement_id ON contracts(settlement_id);
CREATE INDEX IF NOT EXISTS idx_contracts_broker_id ON contracts(broker_id);
CREATE INDEX IF NOT EXISTS idx_contracts_broker_code ON contracts(broker_code);
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_trade_type ON contracts(trade_type);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_date ON contracts(contract_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_bill_generated ON contracts(bill_generated);
CREATE INDEX IF NOT EXISTS idx_contracts_party_bill_id ON contracts(party_bill_id);
CREATE INDEX IF NOT EXISTS idx_contracts_broker_bill_id ON contracts(broker_bill_id);

-- Create indexes for stock_holdings
CREATE INDEX IF NOT EXISTS idx_stock_holdings_party_id ON stock_holdings(party_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_company_id ON stock_holdings(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_party_company ON stock_holdings(party_id, company_id);

-- Create indexes for broker_master
CREATE INDEX IF NOT EXISTS idx_broker_master_broker_code ON broker_master(broker_code);
CREATE INDEX IF NOT EXISTS idx_broker_master_name ON broker_master(name);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_party_master_updated_at BEFORE UPDATE ON party_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_master_updated_at BEFORE UPDATE ON company_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_master_updated_at BEFORE UPDATE ON settlement_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_settings_updated_at BEFORE UPDATE ON application_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to ledger_entries table
CREATE TRIGGER update_ledger_entries_updated_at BEFORE UPDATE ON ledger_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to contracts table
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to broker_master table
CREATE TRIGGER update_broker_master_updated_at BEFORE UPDATE ON broker_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: stock_holdings uses 'last_updated' column, which is manually set in update_stock_holdings_from_contract()
-- No automatic trigger needed here

-- Create function to update stock holdings automatically
-- Updated to keep zero-quantity holdings for historical tracking
CREATE OR REPLACE FUNCTION update_stock_holdings_from_contract()
RETURNS TRIGGER AS $$
DECLARE
    current_holding RECORD;
    new_quantity INTEGER;
    new_total_invested DECIMAL(15,2);
    new_avg_price DECIMAL(10,2);
BEGIN
    -- Only process if contract has company_id
    -- Process both T (Trading) and D (Delivery) trades
    IF NEW.company_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current holding
    SELECT * INTO current_holding 
    FROM stock_holdings 
    WHERE party_id = NEW.party_id AND company_id = NEW.company_id;

    IF NEW.contract_type = 'buy' THEN
        -- Add to holdings
        IF current_holding IS NULL THEN
            -- Create new holding
            INSERT INTO stock_holdings (
                party_id, 
                company_id, 
                quantity, 
                avg_buy_price, 
                total_invested,
                last_trade_date
            ) VALUES (
                NEW.party_id,
                NEW.company_id,
                NEW.quantity,
                NEW.rate,
                NEW.amount,
                NEW.contract_date
            );
        ELSE
            -- Update existing holding
            new_quantity := current_holding.quantity + NEW.quantity;
            new_total_invested := current_holding.total_invested + NEW.amount;
            
            -- Calculate new average price
            IF new_quantity > 0 THEN
                new_avg_price := new_total_invested / new_quantity;
            ELSE
                new_avg_price := current_holding.avg_buy_price;
            END IF;
            
            UPDATE stock_holdings
            SET quantity = new_quantity,
                total_invested = new_total_invested,
                avg_buy_price = new_avg_price,
                last_trade_date = NEW.contract_date,
                last_updated = CURRENT_TIMESTAMP
            WHERE party_id = NEW.party_id AND company_id = NEW.company_id;
        END IF;
    ELSIF NEW.contract_type = 'sell' THEN
        -- Reduce from holdings
        IF current_holding IS NOT NULL THEN
            new_quantity := current_holding.quantity - NEW.quantity;
            
            -- Keep the holding even if quantity becomes zero or negative
            -- This preserves historical data and allows users to see closed positions
            IF new_quantity <= 0 THEN
                -- Set quantity to 0 and keep avg_buy_price for reference
                UPDATE stock_holdings
                SET quantity = 0,
                    total_invested = 0,
                    last_trade_date = NEW.contract_date,
                    last_updated = CURRENT_TIMESTAMP
                WHERE party_id = NEW.party_id AND company_id = NEW.company_id;
            ELSE
                -- Update holding with reduced quantity
                new_total_invested := (current_holding.total_invested / current_holding.quantity) * new_quantity;
                
                UPDATE stock_holdings
                SET quantity = new_quantity,
                    total_invested = new_total_invested,
                    last_trade_date = NEW.contract_date,
                    last_updated = CURRENT_TIMESTAMP
                WHERE party_id = NEW.party_id AND company_id = NEW.company_id;
            END IF;
        ELSE
            -- Selling without existing holding - create a holding with negative quantity
            -- This represents a short position or an error
            INSERT INTO stock_holdings (
                party_id, 
                company_id, 
                quantity, 
                avg_buy_price, 
                total_invested,
                last_trade_date
            ) VALUES (
                NEW.party_id,
                NEW.company_id,
                -NEW.quantity,
                NEW.rate,
                0,
                NEW.contract_date
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update holdings when contract is inserted
CREATE TRIGGER trigger_update_stock_holdings_on_contract
    AFTER INSERT ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_holdings_from_contract();

-- Insert default application settings
INSERT INTO application_settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', 'Broker ERP', 'string', 'Application name'),
('app_version', '1.0.0', 'string', 'Application version'),
('default_trading_slab', '0.25', 'number', 'Default trading slab percentage'),
('default_delivery_slab', '0.50', 'number', 'Default delivery slab percentage'),
('currency', 'INR', 'string', 'Default currency'),
('financial_year_start', '04-01', 'string', 'Financial year start date (MM-DD)'),
('backup_enabled', 'true', 'boolean', 'Enable automatic backups'),
('max_file_size_mb', '50', 'number', 'Maximum file upload size in MB')
ON CONFLICT (setting_key) DO NOTHING;

-- Sample data (optional - remove if not needed)
-- Insert sample party
INSERT INTO party_master (party_code, name, nse_code, address, city, phone, trading_slab, delivery_slab) VALUES
('SAMPLE001', 'Sample Trading Party', 'STP001', '123 Business Street', 'Mumbai', '+91-98765-43210', 0.25, 0.50)
ON CONFLICT (party_code) DO NOTHING;

-- Insert sample broker
INSERT INTO broker_master (broker_code, name, address, city, phone, trading_slab, delivery_slab) VALUES
('GROW', 'Groww Broker', '456 Finance Street', 'Bangalore', '+91-98765-43211', 0.30, 0.60),
('A2', 'AngelOne Broker', '789 Trading Avenue', 'Delhi', '+91-98765-43212', 0.25, 0.50)
ON CONFLICT (broker_code) DO NOTHING;

-- Insert sample company
INSERT INTO company_master (company_code, name, nse_code) VALUES
('RELIANCE', 'Reliance Industries Limited', 'RELIANCE'),
('TCS', 'Tata Consultancy Services', 'TCS'),
('INFY', 'Infosys Limited', 'INFY')
ON CONFLICT (company_code) DO NOTHING;

-- Insert sample settlement
INSERT INTO settlement_master (type, settlement_number, start_date, end_date, contract_no, notes) VALUES
('nse', '2024NSE001', '2024-01-01', '2024-01-31', 'NSE-2024-JAN-001', 'January 2024 NSE Settlement')
ON CONFLICT (settlement_number) DO NOTHING;

-- Insert sample contract (optional - remove if not needed)
-- Note: This requires existing party and settlement records
-- INSERT INTO contracts (contract_number, party_id, settlement_id, contract_date, quantity, rate, amount, contract_type, status) 
-- SELECT 'CNT001', p.id, s.id, '2024-01-15', 100, 2500.00, 250000.00, 'buy', 'active'
-- FROM party_master p, settlement_master s 
-- WHERE p.party_code = 'SAMPLE001' AND s.settlement_number = '2024NSE001'
-- ON CONFLICT (contract_number) DO NOTHING;

COMMIT;
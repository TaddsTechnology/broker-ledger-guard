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
    bill_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
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
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_payments_party_id ON payments(party_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_party_id ON ledger_entries(party_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entry_date ON ledger_entries(entry_date);

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

COMMIT;
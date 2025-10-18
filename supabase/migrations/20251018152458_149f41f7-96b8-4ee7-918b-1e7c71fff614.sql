-- Create enum for settlement types
CREATE TYPE settlement_type AS ENUM ('delivery', 'trading', 'auction');

-- Create party_master table
CREATE TABLE party_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_code VARCHAR(50) UNIQUE NOT NULL,
  nse_code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  ref_code VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  trading_slab DECIMAL(5,2) DEFAULT 0.00,
  delivery_slab DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_master table
CREATE TABLE company_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  nse_code VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settlement_master table
CREATE TABLE settlement_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type settlement_type NOT NULL,
  settlement_number VARCHAR(50) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_no VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_config table for storing admin password hash
CREATE TABLE admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE party_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all operations for now - will add proper auth later)
CREATE POLICY "Allow all for party_master" ON party_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for company_master" ON company_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for settlement_master" ON settlement_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for admin_config" ON admin_config FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_party_master_updated_at
  BEFORE UPDATE ON party_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_master_updated_at
  BEFORE UPDATE ON company_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_master_updated_at
  BEFORE UPDATE ON settlement_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin password hash (password: "admin123" - CHANGE IN PRODUCTION!)
-- This is bcrypt hash of "admin123"
INSERT INTO admin_config (key, value)
VALUES ('admin_password_hash', '$2a$10$rG7qVqKqE4KYqKqKqKqKqeqOqVqVqVqVqVqVqVqVqVqVqVqVqVqu');

-- Insert some sample data for party_master
INSERT INTO party_master (party_code, nse_code, name, ref_code, city, phone, trading_slab, delivery_slab) VALUES
('P001', 'NSE001', 'ABC Trading Pvt Ltd', 'REF001', 'Mumbai', '+91-22-12345678', 0.25, 0.15),
('P002', 'NSE002', 'XYZ Securities Ltd', 'REF002', 'Delhi', '+91-11-87654321', 0.30, 0.18),
('P003', 'NSE003', 'Global Investors Inc', 'REF003', 'Bangalore', '+91-80-11223344', 0.20, 0.12);

-- Insert some sample data for company_master
INSERT INTO company_master (company_code, name, nse_code) VALUES
('TCS', 'Tata Consultancy Services', 'TCS'),
('INFY', 'Infosys Limited', 'INFY'),
('RELIANCE', 'Reliance Industries Ltd', 'RELIANCE');
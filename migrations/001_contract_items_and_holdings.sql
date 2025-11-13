-- Migration: Contract Items Update and Stock Holdings
-- Date: 2025-11-13
-- Description: 
--   1. Add company_id and trade_type to contracts table (each contract is now item-specific)
--   2. Create stock_holdings table to track client portfolios

-- Step 1: Add new columns to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES company_master(id),
ADD COLUMN IF NOT EXISTS trade_type VARCHAR(1) CHECK (trade_type IN ('D', 'T'));

-- Step 2: Create stock_holdings table
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
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_trade_type ON contracts(trade_type);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_party_id ON stock_holdings(party_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_company_id ON stock_holdings(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_party_company ON stock_holdings(party_id, company_id);

-- Create trigger for last_updated
CREATE TRIGGER update_stock_holdings_last_updated BEFORE UPDATE ON stock_holdings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update stock holdings automatically
CREATE OR REPLACE FUNCTION update_stock_holdings_from_contract()
RETURNS TRIGGER AS $$
DECLARE
    current_holding RECORD;
    new_quantity INTEGER;
    new_total_invested DECIMAL(15,2);
    new_avg_price DECIMAL(10,2);
BEGIN
    -- Only process if contract has company_id and is delivery type
    IF NEW.company_id IS NULL OR NEW.trade_type != 'D' THEN
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
            new_avg_price := new_total_invested / new_quantity;
            
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
            
            IF new_quantity <= 0 THEN
                -- Delete holding if quantity becomes zero or negative
                DELETE FROM stock_holdings 
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

COMMIT;

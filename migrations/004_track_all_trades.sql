-- Migration: Track Both Trading and Delivery Trades
-- Date: 2025-11-13
-- Description: Update trigger to track both T (Trading) and D (Delivery) trades in stock holdings

-- Update the function to process both T and D trades
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

COMMIT;

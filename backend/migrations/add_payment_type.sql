-- Migration: Add payment_type column to support Pay-In and Pay-Out
-- Date: 2024-11-24

-- Add payment_type to Equity payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(10) DEFAULT 'payin' CHECK (payment_type IN ('payin', 'payout'));

-- Add payment_type to F&O payments table
ALTER TABLE fo_payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(10) DEFAULT 'payin' CHECK (payment_type IN ('payin', 'payout'));

-- Update existing records to 'payin' (default)
UPDATE payments SET payment_type = 'payin' WHERE payment_type IS NULL;
UPDATE fo_payments SET payment_type = 'payin' WHERE payment_type IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN payments.payment_type IS 'Payment direction: payin (party pays you) or payout (you pay party)';
COMMENT ON COLUMN fo_payments.payment_type IS 'Payment direction: payin (party pays you) or payout (you pay party)';

-- Verify changes
SELECT 'Equity payments table updated' as status;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'payment_type';

SELECT 'F&O payments table updated' as status;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'fo_payments' AND column_name = 'payment_type';

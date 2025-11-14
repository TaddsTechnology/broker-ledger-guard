-- Migration: Add lot_size columns and CF trade type support
-- Date: 2025-01-14

-- Add lot_size column to fo_contracts
ALTER TABLE fo_contracts ADD COLUMN IF NOT EXISTS lot_size INTEGER;

-- Add lot_size column to fo_bill_items
ALTER TABLE fo_bill_items ADD COLUMN IF NOT EXISTS lot_size INTEGER;

-- Update comment for trade_type column
COMMENT ON COLUMN fo_contracts.trade_type IS 'BUY, SELL, or CF (Carry Forward - SELL first then BUY)';

-- Migration complete

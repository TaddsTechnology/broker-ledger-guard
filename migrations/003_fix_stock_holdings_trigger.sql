-- Migration: Fix Stock Holdings Trigger
-- Date: 2025-11-13
-- Description: Drop incorrect trigger that tries to update 'updated_at' column which doesn't exist
--              The stock_holdings table uses 'last_updated' instead, which is manually set

-- Drop the incorrect trigger if it exists
DROP TRIGGER IF EXISTS update_stock_holdings_last_updated ON stock_holdings;

COMMIT;

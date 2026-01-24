-- Migration: Add proper broker tracking for F&O positions
-- Date: 2026-01-08
-- Approach: Create junction table for many-to-many relationship between positions and brokers

-- Create junction table for position-broker relationships
CREATE TABLE IF NOT EXISTS fo_position_brokers (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES fo_positions(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES broker_master(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(position_id, broker_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fo_position_brokers_position ON fo_position_brokers(position_id);
CREATE INDEX IF NOT EXISTS idx_fo_position_brokers_broker ON fo_position_brokers(broker_id);

-- Add comments for clarity
COMMENT ON TABLE fo_position_brokers IS 'Junction table tracking broker involvement in F&O positions';
COMMENT ON COLUMN fo_position_brokers.position_id IS 'Reference to the F&O position';
COMMENT ON COLUMN fo_position_brokers.broker_id IS 'Reference to the broker';
COMMENT ON COLUMN fo_position_brokers.quantity IS 'Quantity associated with this broker for this position';

-- Verify changes
SELECT 'F&O position brokers junction table created' as status;

-- Check if the table was created successfully
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fo_position_brokers'
ORDER BY ordinal_position;
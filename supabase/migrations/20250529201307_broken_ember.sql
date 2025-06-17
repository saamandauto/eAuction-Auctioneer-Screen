-- Define the lot_user_activity table
CREATE TABLE IF NOT EXISTS lot_user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  lot_number integer NOT NULL REFERENCES lots(lot_number) ON DELETE CASCADE,
  dealer_id text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('viewer', 'watcher', 'lead', 'online')),
  last_active text NOT NULL,
  last_buy text NOT NULL,
  dealer_name text NOT NULL,
  dealer_type text NOT NULL
);

-- Add unique constraint to prevent duplicates
ALTER TABLE lot_user_activity 
  ADD CONSTRAINT unique_lot_user_activity 
  UNIQUE (lot_number, dealer_id, activity_type);

-- Create index for faster lookup by lot_number
CREATE INDEX idx_lot_user_activity_lot_number 
  ON lot_user_activity(lot_number);

-- Create index for faster lookup by dealer_id
CREATE INDEX idx_lot_user_activity_dealer_id 
  ON lot_user_activity(dealer_id);

-- Enable Row Level Security
ALTER TABLE lot_user_activity ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow authenticated read access to lot_user_activity" 
  ON lot_user_activity FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert access to lot_user_activity" 
  ON lot_user_activity FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to lot_user_activity" 
  ON lot_user_activity FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access to lot_user_activity" 
  ON lot_user_activity FOR DELETE TO authenticated USING (true);

-- Policies for anon users
CREATE POLICY "Allow anon read access to lot_user_activity" 
  ON lot_user_activity FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert access to lot_user_activity" 
  ON lot_user_activity FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update access to lot_user_activity" 
  ON lot_user_activity FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete access to lot_user_activity" 
  ON lot_user_activity FOR DELETE TO anon USING (true);
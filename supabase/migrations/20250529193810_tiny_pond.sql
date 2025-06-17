-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  text text NOT NULL,
  time text NOT NULL,
  alternate boolean NOT NULL,
  dealer text NOT NULL,
  dealer_id text NOT NULL,
  recipient_id text,
  type text,
  is_global boolean,
  is_read boolean
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users

-- Allow authenticated users to select (read) messages
CREATE POLICY "Allow authenticated read access to messages"
ON messages FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert (create) messages
CREATE POLICY "Allow authenticated insert access to messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update messages (e.g., mark as read)
CREATE POLICY "Allow authenticated update access to messages"
ON messages FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete messages (if needed)
CREATE POLICY "Allow authenticated delete access to messages"
ON messages FOR DELETE
TO authenticated
USING (true);

-- Policies for anon users (if needed, though typically messages are for authenticated)

-- Allow anon users to select (read) messages (if public messages are allowed)
CREATE POLICY "Allow anon read access to messages"
ON messages FOR SELECT
TO anon
USING (true);

-- Allow anon users to insert (create) messages (if public messages are allowed)
CREATE POLICY "Allow anon insert access to messages"
ON messages FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to update messages
CREATE POLICY "Allow anon update access to messages"
ON messages FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anon users to delete messages
CREATE POLICY "Allow anon delete access to messages"
ON messages FOR DELETE
TO anon
USING (true);
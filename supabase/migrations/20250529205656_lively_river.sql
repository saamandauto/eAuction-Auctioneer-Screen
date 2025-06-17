/*
  # Create auction table

  1. New Table
    - `auction` - Stores information about the auction itself
      - `id` (uuid, primary key) - Unique identifier for the auction
      - `auction_title` (text) - Title of the auction
      - `auction_id` (text) - Auction ID (e.g., 1067268)
      - `auction_date` (text) - Date and time of the auction
      - `auction_company` (text) - Company hosting the auction
      - `created_at` (timestamptz) - Timestamp when the record was created

  2. Security
    - Enable RLS on `auction` table
    - Add policies for authenticated and anon users to read all auctions
*/

-- Create the auction table
CREATE TABLE IF NOT EXISTS auction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_title text NOT NULL,
  auction_id text NOT NULL,
  auction_date text NOT NULL,
  auction_company text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE auction ENABLE ROW LEVEL SECURITY;

-- Create policies for authentication and anonymous users
CREATE POLICY "Allow read access for all authenticated users" 
ON auction 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow read access for anon users" 
ON auction 
FOR SELECT 
TO anon 
USING (true);
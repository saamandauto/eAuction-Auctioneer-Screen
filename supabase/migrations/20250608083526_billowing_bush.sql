/*
  # Create content table for internationalization

  1. New Table
    - `content` - Stores localized text content
      - `system` (integer) - System identifier (always 1 for this application)
      - `locale` (text) - Language and region code (e.g., en_GB, da_DK)
      - `path` (text) - Application path/section
      - `filename` (text) - Component or feature name
      - `key` (text) - Specific text identifier
      - `value` (text) - The actual translated text
      - Composite primary key on (system, locale, path, filename, key)

  2. Security
    - Enable RLS on `content` table
    - Add policies for read access to authenticated and anonymous users
*/

-- Create the content table for internationalization
CREATE TABLE IF NOT EXISTS content (
  system integer NOT NULL,
  locale text NOT NULL,
  path text NOT NULL,
  filename text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (system, locale, path, filename, key)
);

-- Enable Row Level Security
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Allow read access for all authenticated users" 
ON content 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow read access for anon users" 
ON content 
FOR SELECT 
TO anon 
USING (true);

-- Create index for faster lookups by locale
CREATE INDEX IF NOT EXISTS idx_content_locale ON content(locale);

-- Create index for faster lookups by path and filename
CREATE INDEX IF NOT EXISTS idx_content_path_filename ON content(path, filename);
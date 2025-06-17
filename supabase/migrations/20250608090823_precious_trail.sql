/*
  # Add default localization settings to auction table

  1. Schema Changes
    - Add `default_locale` column to store the default language (e.g., en_GB, da_DK)
    - Add `default_currency` column to store the default currency (e.g., GBP, DKK, EUR)

  2. Purpose
    - Allow each auction to have its own default language and currency settings
    - Application will load these defaults when starting up
*/

-- Add default_locale column with default value
ALTER TABLE auction ADD COLUMN IF NOT EXISTS default_locale text DEFAULT 'en_GB';

-- Add default_currency column with default value  
ALTER TABLE auction ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'GBP';

-- Update existing records to have the default values
UPDATE auction 
SET default_locale = 'en_GB', default_currency = 'GBP' 
WHERE default_locale IS NULL OR default_currency IS NULL;

-- Make the columns NOT NULL now that we've populated them
ALTER TABLE auction ALTER COLUMN default_locale SET NOT NULL;
ALTER TABLE auction ALTER COLUMN default_currency SET NOT NULL;
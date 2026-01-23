-- Add delivery proof fields to deliveries table

-- Add proof_photo_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='deliveries' AND column_name='proof_photo_url') THEN
        ALTER TABLE deliveries ADD COLUMN proof_photo_url TEXT;
    END IF;
END $$;

-- Add proof_sent_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='deliveries' AND column_name='proof_sent_at') THEN
        ALTER TABLE deliveries ADD COLUMN proof_sent_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add signature_url column for optional signature capture
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='deliveries' AND column_name='signature_url') THEN
        ALTER TABLE deliveries ADD COLUMN signature_url TEXT;
    END IF;
END $$;

-- Add delivery_notes column for driver notes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='deliveries' AND column_name='delivery_notes') THEN
        ALTER TABLE deliveries ADD COLUMN delivery_notes TEXT;
    END IF;
END $$;

-- Create index for proof_sent_at
CREATE INDEX IF NOT EXISTS idx_deliveries_proof_sent ON deliveries(proof_sent_at)
WHERE proof_sent_at IS NOT NULL;

-- Create index for proof_photo_url
CREATE INDEX IF NOT EXISTS idx_deliveries_proof_photo ON deliveries(proof_photo_url)
WHERE proof_photo_url IS NOT NULL;

COMMENT ON COLUMN deliveries.proof_photo_url IS 'URL to delivery proof photo in Supabase Storage';
COMMENT ON COLUMN deliveries.proof_sent_at IS 'Timestamp when proof was sent to customer';
COMMENT ON COLUMN deliveries.signature_url IS 'URL to customer signature (optional)';
COMMENT ON COLUMN deliveries.delivery_notes IS 'Driver notes about the delivery';

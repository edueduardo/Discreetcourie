-- Migration: Expenses & Leads Tables
-- Discreet Courier - Remove all mocked data

-- ============================================
-- EXPENSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fuel', 'vehicle', 'maintenance', 'supplies', 'insurance', 'other')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor VARCHAR(255),
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- ============================================
-- LEADS TABLE (CRM)
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    source VARCHAR(50) CHECK (source IN ('website', 'referral', 'cold-call', 'social', 'ad', 'other')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
    potential_value DECIMAL(10, 2),
    tags TEXT[],
    notes TEXT,
    next_followup DATE,
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_followup);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Expenses: Authenticated users can CRUD
CREATE POLICY "Authenticated users can manage expenses" ON expenses
    FOR ALL USING (auth.role() = 'authenticated');

-- Leads: Authenticated users can CRUD
CREATE POLICY "Authenticated users can manage leads" ON leads
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON expenses TO authenticated;
GRANT ALL ON leads TO authenticated;

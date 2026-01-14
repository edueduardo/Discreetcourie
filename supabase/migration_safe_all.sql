-- ============================================
-- SAFE MIGRATION - Discreet Courier
-- This script uses IF NOT EXISTS and DROP IF EXISTS
-- to safely run on existing databases
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES (safe creation)
-- ============================================

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_priority AS ENUM ('standard', 'express', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE privacy_level AS ENUM ('full', 'city_only', 'status_only', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_status AS ENUM ('completed', 'failed', 'no_answer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vetting_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'probation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vault_item_type AS ENUM ('storage', 'last_will', 'time_capsule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vault_status AS ENUM ('active', 'delivered', 'expired', 'destroyed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE last_will_trigger AS ENUM ('death_certificate', 'no_checkin', 'manual', 'specific_date');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    notes TEXT,
    privacy_level privacy_level DEFAULT 'status_only',
    -- VIP fields
    code_name VARCHAR(50),
    is_vip BOOLEAN DEFAULT FALSE,
    service_level INTEGER DEFAULT 1,
    guardian_mode_active BOOLEAN DEFAULT FALSE,
    pact_signed BOOLEAN DEFAULT FALSE,
    nda_signed BOOLEAN DEFAULT FALSE,
    vetting_status vetting_status DEFAULT 'pending',
    preferred_payment VARCHAR(50) DEFAULT 'normal',
    communication_preference VARCHAR(50) DEFAULT 'sms',
    retainer_active BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_code_name ON clients(code_name);
CREATE INDEX IF NOT EXISTS idx_clients_is_vip ON clients(is_vip);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_code VARCHAR(20) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    pickup_address TEXT NOT NULL,
    pickup_contact VARCHAR(255),
    pickup_phone VARCHAR(50),
    pickup_notes TEXT,
    pickup_time TIMESTAMPTZ,
    delivery_address TEXT NOT NULL,
    delivery_contact VARCHAR(255),
    delivery_phone VARCHAR(50),
    delivery_notes TEXT,
    delivery_time TIMESTAMPTZ,
    package_description TEXT,
    package_size VARCHAR(20) DEFAULT 'small',
    is_fragile BOOLEAN DEFAULT FALSE,
    is_confidential BOOLEAN DEFAULT FALSE,
    is_vip BOOLEAN DEFAULT FALSE,
    status delivery_status DEFAULT 'pending',
    priority delivery_priority DEFAULT 'standard',
    price DECIMAL(10, 2) DEFAULT 0,
    paid BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    proof_photo_url TEXT,
    signature_url TEXT,
    delivered_at TIMESTAMPTZ,
    delivery_notes_final TEXT,
    bland_call_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_tracking ON deliveries(tracking_code);
CREATE INDEX IF NOT EXISTS idx_deliveries_client ON deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON deliveries(created_at DESC);

-- Delivery Events Table
CREATE TABLE IF NOT EXISTS delivery_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    status delivery_status NOT NULL,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_delivery ON delivery_events(delivery_id);

-- ============================================
-- GPS TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    altitude DECIMAL(10, 2),
    battery_level INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_delivery ON delivery_tracking(delivery_id);
CREATE INDEX IF NOT EXISTS idx_tracking_recorded ON delivery_tracking(recorded_at DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
    expo_push_token TEXT,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    ticket_id VARCHAR(255),
    receipt_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery ON notification_logs(delivery_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_logs(status);

-- ============================================
-- SECURE MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS secure_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT TRUE,
    is_read BOOLEAN DEFAULT FALSE,
    self_destruct_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_client ON secure_messages(client_id);

-- ============================================
-- CONCIERGE TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS concierge_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    special_instructions TEXT,
    budget DECIMAL(10, 2),
    quoted_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'requested',
    priority VARCHAR(20) DEFAULT 'standard',
    no_trace BOOLEAN DEFAULT FALSE,
    nda_required BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_client ON concierge_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON concierge_tasks(status);

-- ============================================
-- VAULT (Human Vault)
-- ============================================

CREATE TABLE IF NOT EXISTS vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    item_type vault_item_type DEFAULT 'storage',
    stored_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    deliver_at TIMESTAMPTZ,
    is_last_will BOOLEAN DEFAULT FALSE,
    last_will_recipient_name VARCHAR(255),
    last_will_recipient_contact TEXT,
    last_will_recipient_relation VARCHAR(100),
    last_will_trigger last_will_trigger,
    last_will_checkin_days INTEGER,
    last_will_last_checkin TIMESTAMPTZ,
    status vault_status DEFAULT 'active',
    storage_location VARCHAR(255),
    access_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_client ON vault_items(client_id);
CREATE INDEX IF NOT EXISTS idx_vault_status ON vault_items(status);
CREATE INDEX IF NOT EXISTS idx_vault_type ON vault_items(item_type);

-- ============================================
-- DESTRUCTION LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS destruction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    customer_code VARCHAR(50) NOT NULL,
    items_destroyed JSONB NOT NULL,
    requested_by VARCHAR(50) NOT NULL,
    reason TEXT,
    video_url TEXT,
    video_sent BOOLEAN DEFAULT FALSE,
    executed_by VARCHAR(255),
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destruction_client ON destruction_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_destruction_executed ON destruction_logs(executed_at DESC);

-- ============================================
-- EMERGENCY PROTOCOLS
-- ============================================

CREATE TABLE IF NOT EXISTS emergency_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    client_code VARCHAR(50) NOT NULL,
    client_name VARCHAR(255),
    protocol_name VARCHAR(255) NOT NULL,
    trigger_condition TEXT NOT NULL,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_client ON emergency_protocols(client_id);
CREATE INDEX IF NOT EXISTS idx_emergency_active ON emergency_protocols(is_active);

-- ============================================
-- VETTING RECORDS
-- ============================================

CREATE TABLE IF NOT EXISTS vetting_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    client_code VARCHAR(50),
    client_name VARCHAR(255),
    status vetting_status DEFAULT 'pending',
    source VARCHAR(255),
    referral_code VARCHAR(50),
    risk_assessment VARCHAR(20) DEFAULT 'unknown',
    red_flags JSONB DEFAULT '[]'::jsonb,
    interview_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    decision_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vetting_client ON vetting_records(client_id);
CREATE INDEX IF NOT EXISTS idx_vetting_status ON vetting_records(status);

-- ============================================
-- GUARDIAN SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS guardian_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    client_code VARCHAR(50) NOT NULL,
    client_name VARCHAR(255),
    direct_line VARCHAR(50),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    monthly_rate DECIMAL(10, 2) DEFAULT 500.00,
    priority_level INTEGER DEFAULT 1,
    total_alerts INTEGER DEFAULT 0,
    last_alert_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_client ON guardian_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_guardian_active ON guardian_subscriptions(is_active);

-- ============================================
-- GUARDIAN ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS guardian_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES guardian_subscriptions(id) ON DELETE CASCADE,
    client_code VARCHAR(50) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_subscription ON guardian_alerts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON guardian_alerts(resolved);

-- ============================================
-- EXPENSES
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor VARCHAR(255),
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- ============================================
-- LEADS (CRM)
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new',
    potential_value DECIMAL(10, 2),
    tags JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    next_followup DATE,
    assigned_to UUID,
    converted_client_id UUID REFERENCES clients(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON leads(next_followup);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

-- ============================================
-- BLAND.AI CALLS
-- ============================================

CREATE TABLE IF NOT EXISTS bland_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id VARCHAR(255) UNIQUE NOT NULL,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    phone_number VARCHAR(50) NOT NULL,
    direction call_direction DEFAULT 'inbound',
    status call_status DEFAULT 'completed',
    duration INTEGER,
    transcript TEXT,
    summary TEXT,
    extracted_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_delivery ON bland_calls(delivery_id);
CREATE INDEX IF NOT EXISTS idx_calls_phone ON bland_calls(phone_number);

-- ============================================
-- RLS POLICIES (Drop and recreate)
-- ============================================

-- Clients
DROP POLICY IF EXISTS "Allow authenticated users" ON clients;
CREATE POLICY "Allow authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');

-- Deliveries
DROP POLICY IF EXISTS "Allow authenticated users" ON deliveries;
CREATE POLICY "Allow authenticated users" ON deliveries FOR ALL USING (auth.role() = 'authenticated');

-- Delivery Events
DROP POLICY IF EXISTS "Allow authenticated users" ON delivery_events;
CREATE POLICY "Allow authenticated users" ON delivery_events FOR ALL USING (auth.role() = 'authenticated');

-- Tracking
DROP POLICY IF EXISTS "Allow read tracking for all" ON delivery_tracking;
DROP POLICY IF EXISTS "Allow insert tracking for authenticated" ON delivery_tracking;
CREATE POLICY "Allow read tracking for all" ON delivery_tracking FOR SELECT USING (true);
CREATE POLICY "Allow insert tracking for authenticated" ON delivery_tracking FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications
DROP POLICY IF EXISTS "Allow authenticated users" ON notification_logs;
CREATE POLICY "Allow authenticated users" ON notification_logs FOR ALL USING (auth.role() = 'authenticated');

-- Messages
DROP POLICY IF EXISTS "Allow authenticated users" ON secure_messages;
CREATE POLICY "Allow authenticated users" ON secure_messages FOR ALL USING (auth.role() = 'authenticated');

-- Concierge
DROP POLICY IF EXISTS "Allow authenticated users" ON concierge_tasks;
CREATE POLICY "Allow authenticated users" ON concierge_tasks FOR ALL USING (auth.role() = 'authenticated');

-- Vault
DROP POLICY IF EXISTS "Allow authenticated users" ON vault_items;
CREATE POLICY "Allow authenticated users" ON vault_items FOR ALL USING (auth.role() = 'authenticated');

-- Destruction
DROP POLICY IF EXISTS "Allow authenticated users" ON destruction_logs;
CREATE POLICY "Allow authenticated users" ON destruction_logs FOR ALL USING (auth.role() = 'authenticated');

-- Emergency
DROP POLICY IF EXISTS "Allow authenticated users" ON emergency_protocols;
CREATE POLICY "Allow authenticated users" ON emergency_protocols FOR ALL USING (auth.role() = 'authenticated');

-- Vetting
DROP POLICY IF EXISTS "Allow authenticated users" ON vetting_records;
CREATE POLICY "Allow authenticated users" ON vetting_records FOR ALL USING (auth.role() = 'authenticated');

-- Guardian
DROP POLICY IF EXISTS "Allow authenticated users" ON guardian_subscriptions;
CREATE POLICY "Allow authenticated users" ON guardian_subscriptions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users" ON guardian_alerts;
CREATE POLICY "Allow authenticated users" ON guardian_alerts FOR ALL USING (auth.role() = 'authenticated');

-- Expenses
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON expenses;
CREATE POLICY "Authenticated users can manage expenses" ON expenses FOR ALL USING (auth.role() = 'authenticated');

-- Leads
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON leads;
CREATE POLICY "Authenticated users can manage leads" ON leads FOR ALL USING (auth.role() = 'authenticated');

-- Invoices
DROP POLICY IF EXISTS "Allow authenticated users" ON invoices;
CREATE POLICY "Allow authenticated users" ON invoices FOR ALL USING (auth.role() = 'authenticated');

-- Bland Calls
DROP POLICY IF EXISTS "Allow authenticated users" ON bland_calls;
CREATE POLICY "Allow authenticated users" ON bland_calls FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE destruction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE vetting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bland_calls ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON clients TO authenticated;
GRANT ALL ON deliveries TO authenticated;
GRANT ALL ON delivery_events TO authenticated;
GRANT ALL ON delivery_tracking TO authenticated;
GRANT ALL ON notification_logs TO authenticated;
GRANT ALL ON secure_messages TO authenticated;
GRANT ALL ON concierge_tasks TO authenticated;
GRANT ALL ON vault_items TO authenticated;
GRANT ALL ON destruction_logs TO authenticated;
GRANT ALL ON emergency_protocols TO authenticated;
GRANT ALL ON vetting_records TO authenticated;
GRANT ALL ON guardian_subscriptions TO authenticated;
GRANT ALL ON guardian_alerts TO authenticated;
GRANT ALL ON expenses TO authenticated;
GRANT ALL ON leads TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON bland_calls TO authenticated;

-- ============================================
-- TRIGGERS (safe creation)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_vault_updated_at ON vault_items;
CREATE TRIGGER update_vault_updated_at BEFORE UPDATE ON vault_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$ BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'All tables, indexes, policies, and triggers are now in place.';
END $$;

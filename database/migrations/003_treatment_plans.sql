-- Migration to add treatment plans and connect them to consultations
-- This properly links the UI plan selection to actual treatment protocols

-- Create treatment_plans table
CREATE TABLE IF NOT EXISTS treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condition VARCHAR(50) NOT NULL,
    plan_tier VARCHAR(20) NOT NULL, -- basic, standard, premium
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_period VARCHAR(20) DEFAULT 'month', -- month, dose, one-time
    protocol_key VARCHAR(50), -- links to treatment protocols (e.g., 'glp1', 'standard')
    features JSONB,
    medications JSONB, -- List of medication SKUs and quantities
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add selected_plan_id to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES treatment_plans(id),
ADD COLUMN IF NOT EXISTS selected_plan_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS selected_plan_price DECIMAL(10,2);


-- Create index for quick lookups
CREATE INDEX idx_treatment_plans_condition ON treatment_plans(condition);
CREATE INDEX idx_treatment_plans_tier ON treatment_plans(plan_tier);
CREATE INDEX idx_consultations_selected_plan ON consultations(selected_plan_id);

-- Create function to link plan to protocol medications
CREATE OR REPLACE FUNCTION get_plan_medications(plan_id UUID)
RETURNS TABLE (
    medication_sku VARCHAR,
    medication_name VARCHAR,
    quantity INTEGER,
    unit_price DECIMAL,
    total_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.sku as medication_sku,
        i.medication_name,
        (m.value->>'qty')::INTEGER as quantity,
        i.retail_price as unit_price,
        i.retail_price * (m.value->>'qty')::INTEGER as total_price
    FROM treatment_plans tp
    CROSS JOIN LATERAL jsonb_array_elements(tp.medications) as m(value)
    LEFT JOIN inventory i ON i.sku = m.value->>'sku'
    WHERE tp.id = plan_id;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for treatment_plans
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

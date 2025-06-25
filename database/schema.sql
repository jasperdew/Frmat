-- FormFlow Database Schema
-- Voer dit uit in je Supabase SQL Editor

-- Forms table
CREATE TABLE forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme JSONB DEFAULT '{
    "primary_color": "#3B82F6",
    "secondary_color": "#1E40AF", 
    "background_color": "#F8FAFC",
    "text_color": "#1F2937",
    "font_family": "Inter, sans-serif"
  }',
  settings JSONB DEFAULT '{
    "allow_multiple_submissions": false,
    "show_progress_bar": true,
    "auto_save": true
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Steps table
CREATE TABLE steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  fields JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  metadata JSONB DEFAULT '{
    "user_agent": "",
    "ip_address": "",
    "timestamp": ""
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "Users can view their own forms" ON forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access for embedded forms
CREATE POLICY "Public can view published forms" ON forms
  FOR SELECT USING (true);

-- Steps policies
CREATE POLICY "Users can view steps of their forms" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert steps for their forms" ON steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps of their forms" ON steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete steps of their forms" ON steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
    )
  );

-- Public read access for embedded form steps
CREATE POLICY "Public can view published form steps" ON steps
  FOR SELECT USING (true);

-- Submissions policies
CREATE POLICY "Users can view submissions of their forms" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = submissions.form_id AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert submissions" ON submissions
  FOR INSERT WITH CHECK (true);

-- Storage setup voor file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes voor performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX idx_steps_form_id ON steps(form_id);
CREATE INDEX idx_steps_order ON steps(form_id, step_order);
CREATE INDEX idx_submissions_form_id ON submissions(form_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);

-- Functions voor automatische timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data voor testing (alleen als je een user hebt)
-- Voer dit uit nadat je een user hebt aangemaakt via Supabase Auth
-- INSERT INTO forms (title, description, user_id) VALUES 
-- ('Klanttevredenheid Enquête', 'Help ons om onze service te verbeteren', auth.uid()),
-- ('Product Feedback', 'Deel uw ervaring met onze producten', auth.uid()),
-- ('Contact Formulier', 'Neem contact met ons op', auth.uid());

-- Sample steps voor de eerste form (uncomment nadat je forms hebt)
-- INSERT INTO steps (form_id, title, step_order, fields) VALUES 
-- (
--   (SELECT id FROM forms WHERE title = 'Klanttevredenheid Enquête' LIMIT 1),
--   'Persoonlijke Informatie',
--   1,
--   '[
--     {
--       "id": "name",
--       "type": "text",
--       "label": "Volledige naam",
--       "placeholder": "Voer uw volledige naam in",
--       "required": true,
--       "validation": {"min": 2}
--     },
--     {
--       "id": "email", 
--       "type": "email",
--       "label": "E-mailadres",
--       "placeholder": "uw.email@voorbeeld.nl",
--       "required": true,
--       "validation": {"pattern": "^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$"}
--     }
--   ]'::jsonb
-- ),
-- (
--   (SELECT id FROM forms WHERE title = 'Klanttevredenheid Enquête' LIMIT 1),
--   'Service Beoordeling',
--   2,
--   '[
--     {
--       "id": "rating",
--       "type": "radio",
--       "label": "Hoe tevreden bent u met onze service?",
--       "required": true,
--       "options": ["Zeer ontevreden", "Ontevreden", "Neutraal", "Tevreden", "Zeer tevreden"]
--     },
--     {
--       "id": "recommend",
--       "type": "radio", 
--       "label": "Zou u ons aanbevelen aan anderen?",
--       "required": true,
--       "options": ["Ja", "Nee", "Misschien"],
--       "conditions": [
--         {
--           "field_id": "rating",
--           "operator": "equals",
--           "value": "Zeer ontevreden",
--           "action": "hide"
--         }
--       ]
--     }
--   ]'::jsonb
-- ); 
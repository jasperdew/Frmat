# FormFlow - Commercieel Typeform-Alternatief

Een moderne, commercieel inzetbare form builder en survey tool gebouwd met Next.js, Supabase en Vercel.

## 🚀 Features

- **Multi-step Forms**: Sequentiële, one-question-per-screen UX
- **Conditional Logic**: Dynamische velden gebaseerd op antwoorden
- **File Uploads**: Ondersteuning voor bestandsuploads via Supabase Storage
- **Theming**: Volledig aanpasbare thema's en styling
- **Embedding**: Eenvoudige integratie op externe websites
- **Real-time Analytics**: Dashboard voor form submissions en analytics
- **Export Functionaliteit**: CSV export van submissions
- **Responsive Design**: Werkt perfect op alle devices

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Forms**: React Hook Form met Zod validatie
- **Hosting**: Vercel (automatische deployments)
- **Styling**: Tailwind CSS met custom theming

## 📋 Setup Instructies

### 1. Project Clone & Dependencies

```bash
# Clone het project
git clone <repository-url>
cd formflow

# Installeer dependencies
npm install
```

### 2. Supabase Setup

1. Ga naar [supabase.com](https://supabase.com) en maak een nieuw project
2. Kopieer je project URL en anon key
3. Maak een `.env.local` bestand aan:

```bash
cp env.example .env.local
```

4. Vul je Supabase credentials in:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema

Voer de volgende SQL uit in je Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Forms table
CREATE TABLE forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Steps table
CREATE TABLE steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order INTEGER NOT NULL,
  fields JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
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
```

### 4. Development Server

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) om de applicatie te bekijken.

## 📖 Gebruik

### Dashboard
- Ga naar `/dashboard` om je formulieren te beheren
- Bekijk submissions en exporteer data naar CSV
- Beheer thema's en instellingen

### Form Embedding
Gebruik de embed functionaliteit om forms op externe websites te plaatsen:

```html
<!-- Embed via iframe -->
<iframe 
  src="https://your-domain.com/embed/form-id"
  width="100%" 
  height="600px" 
  frameborder="0">
</iframe>

<!-- Of gebruik de embed script -->
<script>
  // Luister naar form submissions
  window.addEventListener('message', function(event) {
    if (event.data.type === 'FORM_SUBMITTED') {
      console.log('Form submitted:', event.data);
    }
  });
</script>
```

### API Endpoints

- `POST /api/submit` - Verwerk form submissions
- `GET /embed/[formId]` - Embed form pagina

## 🚀 Deployment

### Vercel Deployment

1. Push je code naar GitHub
2. Verbind je repository met Vercel
3. Configureer environment variables in Vercel dashboard
4. Deploy automatisch!

### Environment Variables voor Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🔧 Customization

### Theming
Pas de styling aan via de theme configuratie:

```typescript
const theme = {
  primary_color: '#3B82F6',
  secondary_color: '#1E40AF',
  background_color: '#F8FAFC',
  text_color: '#1F2937',
  font_family: 'Inter, sans-serif',
  logo_url: 'https://your-logo.com/logo.png'
}
```

### Conditional Logic
Configureer conditional logic voor dynamische forms:

```typescript
const field = {
  id: 'follow_up',
  type: 'text',
  label: 'Follow-up vraag',
  conditions: [
    {
      field_id: 'rating',
      operator: 'greater_than',
      value: 3,
      action: 'show'
    }
  ]
}
```

## 📈 Monitoring & Analytics

- **Vercel Analytics**: Automatische performance monitoring
- **Supabase Logs**: Database en API monitoring
- **Custom Dashboard**: Real-time form analytics

## 🔒 Security

- Row Level Security (RLS) voor data isolatie
- JWT authentication via Supabase
- HTTPS everywhere
- Input validatie en sanitization

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 License

Dit project is closed-source en commercieel eigendom.

## 🆘 Support

Voor support en vragen:
- Open een issue in de repository
- Contacteer het development team
- Bekijk de documentatie in `/docs`

---

**FormFlow** - De moderne oplossing voor professionele form building en data collection. 🚀

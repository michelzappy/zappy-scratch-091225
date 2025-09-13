# Supabase Setup Guide for Telehealth Platform

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up for a free account
3. Create a new project with these details:
   - **Project Name**: telehealth-platform (or your preference)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest to your users

## Step 2: Get Your Credentials

Once your project is created:

1. Go to your project dashboard
2. Click on "Settings" (gear icon) in the sidebar
3. Click on "API" under Project Settings
4. You'll find:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Update Your Environment Variables

Update your `frontend/.env.local` file:

```env
# Replace these with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Set Up Your Database Schema

Run this SQL in the Supabase SQL Editor (found under "SQL Editor" in sidebar):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('patient', 'provider', 'admin')),
    phone TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Patients table
CREATE TABLE public.patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    medical_history JSONB,
    allergies TEXT[],
    current_medications TEXT[],
    insurance_info JSONB,
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Providers table
CREATE TABLE public.providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE NOT NULL,
    specializations TEXT[],
    availability JSONB,
    consultation_fee DECIMAL(10,2),
    bio TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Consultations table
CREATE TABLE public.consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.providers(id),
    condition TEXT NOT NULL,
    symptoms TEXT[],
    hpi TEXT, -- History of Present Illness
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    consultation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescriptions JSONB,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id),
    sender_role TEXT CHECK (sender_role IN ('patient', 'provider')),
    content TEXT NOT NULL,
    attachments JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Prescriptions table
CREATE TABLE public.prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id),
    provider_id UUID REFERENCES public.providers(id),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    refills INTEGER DEFAULT 0,
    notes TEXT,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Orders table
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.prescriptions(id),
    status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB NOT NULL,
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies (example for profiles table)
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX idx_consultations_provider ON public.consultations(provider_id);
CREATE INDEX idx_messages_consultation ON public.messages(consultation_id);
CREATE INDEX idx_orders_patient ON public.orders(patient_id);
```

## Step 5: Set Up Storage Buckets

In the Supabase Dashboard:

1. Go to "Storage" in the sidebar
2. Create these buckets:
   - `avatars` - For profile pictures
   - `medical-documents` - For medical records and documents
   - `prescriptions` - For prescription files
   - `consultation-files` - For consultation attachments

3. Set bucket policies (example for avatars):

```sql
-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Step 6: Test Your Connection

Create a test file `frontend/src/app/test-supabase/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabase() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .single();
        
        if (error) throw error;
        setConnected(true);
      } catch (err: any) {
        setError(err.message);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      {connected ? (
        <p className="text-green-600">✅ Successfully connected to Supabase!</p>
      ) : error ? (
        <p className="text-red-600">❌ Connection failed: {error}</p>
      ) : (
        <p className="text-gray-600">Testing connection...</p>
      )}
    </div>
  );
}
```

Then visit: http://localhost:3000/test-supabase

## Step 7: Authentication Setup

The authentication is already configured in `frontend/src/lib/supabase.ts`. To use it:

```tsx
// Sign up a user
import { signUp } from '@/lib/supabase';

const { data, error } = await signUp(email, password, {
  full_name: 'John Doe',
  role: 'patient'
});

// Sign in
import { signIn } from '@/lib/supabase';

const { data, error } = await signIn(email, password);

// Get current user
import { getCurrentUser } from '@/lib/supabase';

const user = await getCurrentUser();
```

## Common Issues & Solutions

### Issue: "Invalid API key"
**Solution**: Make sure you copied the `anon` key, not the `service_role` key

### Issue: "relation 'profiles' does not exist"
**Solution**: Run the SQL schema in Step 4

### Issue: "Failed to fetch"
**Solution**: Check that your Supabase project is active and the URL is correct

## Security Best Practices

1. **Never expose your service_role key** - Only use the anon key in frontend
2. **Enable RLS** - Always use Row Level Security on your tables
3. **Validate data** - Validate on both frontend and backend
4. **Use environment variables** - Never hardcode credentials
5. **Set up proper policies** - Restrict data access based on user roles

## Next Steps

1. ✅ Update your `.env.local` with real credentials
2. ✅ Run the database schema SQL
3. ✅ Set up storage buckets
4. ✅ Test the connection
5. ✅ Start building with Supabase!

## Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

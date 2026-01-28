# Supabase Setup Guide

Follow these steps to set up Supabase for your Seren Steps Dashboard.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and give the project a name (e.g., "seren-steps")
4. Set a secure database password (save this somewhere safe)
5. Select a region close to you
6. Click "Create new project" and wait for it to initialize

## 2. Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Paste this SQL and click "Run":

```sql
-- Create the tiles table
CREATE TABLE tiles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Globe',
  image_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read tiles (public dashboard)
CREATE POLICY "Allow public read access" ON tiles
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert tiles
CREATE POLICY "Allow public insert" ON tiles
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to update tiles
CREATE POLICY "Allow public update" ON tiles
  FOR UPDATE USING (true);

-- Create a policy that allows anyone to delete tiles
CREATE POLICY "Allow public delete" ON tiles
  FOR DELETE USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_tiles_updated_at
  BEFORE UPDATE ON tiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for the tiles table
ALTER PUBLICATION supabase_realtime ADD TABLE tiles;
```

## 3. Create a Storage Bucket for Images

1. Go to **Storage** (left sidebar)
2. Click "New bucket"
3. Name it: `tile-images`
4. Toggle ON "Public bucket" (so images can be displayed)
5. Click "Create bucket"

6. Click on the `tile-images` bucket
7. Go to **Policies** tab
8. Click "New policy" and choose "For full customization"
9. Add these policies:

**Policy 1 - Allow public uploads:**
- Policy name: `Allow public uploads`
- Allowed operation: `INSERT`
- Target roles: Leave empty (for all)
- Policy definition: `true`

**Policy 2 - Allow public reads:**
- Policy name: `Allow public reads`
- Allowed operation: `SELECT`
- Target roles: Leave empty
- Policy definition: `true`

**Policy 3 - Allow public deletes:**
- Policy name: `Allow public deletes`
- Allowed operation: `DELETE`
- Target roles: Leave empty
- Policy definition: `true`

## 4. Get Your API Keys

1. Go to **Settings** > **API** (left sidebar)
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

## 5. Configure Your App

### For Local Development:

1. Create a `.env.local` file in your project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the app

### For Vercel Deployment:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. In the Vercel project settings, go to **Environment Variables**
4. Add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Deploy!

## Troubleshooting

### "Failed to load links" error
- Check that your Supabase URL and anon key are correct
- Verify the `tiles` table exists in your database
- Check browser console for detailed error messages

### Images not uploading
- Verify the `tile-images` bucket exists and is public
- Check that storage policies allow uploads
- Ensure images are under 2MB

### Changes not syncing between devices
- Realtime should be enabled (see SQL above)
- Check browser console for WebSocket connection issues

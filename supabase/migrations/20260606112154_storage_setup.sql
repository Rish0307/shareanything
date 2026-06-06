INSERT INTO storage.buckets (id, name, public) 
VALUES ('shares', 'shares', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'shares');

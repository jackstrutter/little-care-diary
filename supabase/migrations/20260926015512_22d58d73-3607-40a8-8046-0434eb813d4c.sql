CREATE TABLE public.entries (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  happened_at TIMESTAMPTZ NOT NULL,
  kind TEXT NOT NULL,
  ml INTEGER,
  milk TEXT,
  mins INTEGER,
  diaper_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX entries_user_time_idx ON public.entries (user_id, happened_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own entries"
ON public.entries FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;
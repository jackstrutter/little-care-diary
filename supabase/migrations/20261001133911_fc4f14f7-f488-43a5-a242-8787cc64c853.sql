CREATE TABLE public.health_records (
  id text PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  happened_at timestamptz NOT NULL,
  weight_kg numeric,
  height_cm numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_records TO authenticated;
GRANT ALL ON public.health_records TO service_role;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health records" ON public.health_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
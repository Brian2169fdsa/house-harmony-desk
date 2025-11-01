-- Create houses table
CREATE TABLE public.houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES public.houses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create bed status enum
CREATE TYPE public.bed_status AS ENUM ('available', 'held', 'occupied');

-- Create beds table
CREATE TABLE public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  status public.bed_status DEFAULT 'available' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create residents table (if not exists, otherwise just add bed_id)
CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  room TEXT,
  lease_start DATE,
  lease_end DATE,
  balance NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'Active',
  move_in_date DATE,
  move_out_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add bed_id to residents (backfill with null)
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_rooms_house_id ON public.rooms(house_id);
CREATE INDEX idx_beds_room_id ON public.beds(room_id);
CREATE INDEX idx_residents_bed_id ON public.residents(bed_id);
CREATE INDEX idx_houses_manager_id ON public.houses(manager_id);

-- Enable RLS
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users to read/write for now)
CREATE POLICY "Allow authenticated users full access to houses"
  ON public.houses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to rooms"
  ON public.rooms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to beds"
  ON public.beds FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to residents"
  ON public.residents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
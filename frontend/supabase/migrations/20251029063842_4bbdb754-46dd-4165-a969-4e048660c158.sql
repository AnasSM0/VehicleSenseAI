-- Create vehicles table for registered resident vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  flat_number TEXT,
  phone TEXT,
  is_resident BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create detections table for all vehicle detections
CREATE TABLE public.detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT NOT NULL,
  image_url TEXT,
  confidence_score DECIMAL(3, 2),
  detection_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  vehicle_type TEXT,
  owner_name TEXT,
  verification_status TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create access_logs table for tracking all detection events
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_id UUID REFERENCES public.detections(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles table (authenticated users can read all, only admins can modify)
CREATE POLICY "Anyone authenticated can view vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON public.vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON public.vehicles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON public.vehicles
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for detections table
CREATE POLICY "Anyone authenticated can view detections"
  ON public.detections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert detections"
  ON public.detections
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update detections"
  ON public.detections
  FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for access_logs table
CREATE POLICY "Anyone authenticated can view access logs"
  ON public.access_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert access logs"
  ON public.access_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for vehicles table
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_vehicles_plate_number ON public.vehicles(plate_number);
CREATE INDEX idx_detections_plate_number ON public.detections(plate_number);
CREATE INDEX idx_detections_detection_time ON public.detections(detection_time);
CREATE INDEX idx_access_logs_detection_id ON public.access_logs(detection_id);
CREATE INDEX idx_access_logs_timestamp ON public.access_logs(timestamp);
-- Enable realtime for detections table
ALTER PUBLICATION supabase_realtime ADD TABLE public.detections;

-- Enable realtime for access_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_logs;
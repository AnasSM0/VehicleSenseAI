import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const requestData = await req.json();
    const {
      plate_number,
      image_url,
      confidence_score,
      vehicle_type,
      owner_name,
      verification_status
    } = requestData;

    // Validate required fields
    if (!plate_number) {
      return new Response(
        JSON.stringify({ error: 'plate_number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert detection record
    const { data: detection, error: detectionError } = await supabaseClient
      .from('detections')
      .insert([
        {
          plate_number: plate_number.toUpperCase(),
          image_url: image_url || null,
          confidence_score: confidence_score || null,
          vehicle_type: vehicle_type || null,
          owner_name: owner_name || null,
          verification_status: verification_status || 'Unknown',
          detection_time: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (detectionError) {
      throw detectionError;
    }

    // Create access log entry
    const { error: logError } = await supabaseClient
      .from('access_logs')
      .insert([
        {
          detection_id: detection.id,
          timestamp: new Date().toISOString(),
          status_message: `Vehicle ${plate_number} detected - Status: ${verification_status || 'Unknown'}`
        }
      ]);

    if (logError) {
      console.error('Error creating access log:', logError);
    }

    // Check if vehicle is in residents table
    const { data: resident } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('plate_number', plate_number.toUpperCase())
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        detection: detection,
        is_resident: !!resident,
        resident_info: resident || null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing detection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

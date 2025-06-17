import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Default auction data to seed
const DEFAULT_AUCTION_DATA = {
  auction_title: "NextGen eAuction Demo",
  auction_id: "1067268",
  auction_date: "Thursday, December 13, 13:00",
  auction_company: "Auto Cars Great Britain Ltd",
  default_locale: "en_GB",
  default_currency: "GBP"
};

// Using the built-in Deno.serve
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get Supabase client using environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Create Supabase client using imported createClient
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin access
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Check if auction data already exists
    const { data: existingData, error: countError } = await supabaseClient
      .from('auction')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (countError) {
      throw new Error(`Error checking for existing auction data: ${countError.message}`);
    }
    
    let operation;
    let result;
    
    if (existingData && existingData.length > 0) {
      console.log('Auction data exists, updating the existing record');
      
      // Update existing record
      const { data, error } = await supabaseClient
        .from('auction')
        .update(DEFAULT_AUCTION_DATA)
        .eq('id', existingData[0].id)
        .select();
        
      if (error) {
        throw new Error(`Error updating auction data: ${error.message}`);
      }
      
      operation = 'updated';
      result = data;
    } else {
      console.log('No auction data found, creating a new record');
      
      // Insert new record
      const { data, error } = await supabaseClient
        .from('auction')
        .insert(DEFAULT_AUCTION_DATA)
        .select();
        
      if (error) {
        throw new Error(`Error inserting auction data: ${error.message}`);
      }
      
      operation = 'created';
      result = data;
    }
    
    // Return the result
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully ${operation} auction data`,
        data: result
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in seed-auction-data function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred while seeding auction data'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Function to generate random date in the past
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Function to format date to string
const formatDateTime = (date) => {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Function to generate activity data for a lot
const generateActivityData = async (supabase, lot, dealers, activityType, count) => {
  const result = [];
  
  // Skip if no dealers available
  if (!dealers || dealers.length === 0) {
    return result;
  }

  // Filter out bid users
  const availableDealers = dealers.filter(d => {
    return d.TYPE !== 'Bid User 1' && d.TYPE !== 'Bid User 2';
  });
  
  if (availableDealers.length === 0) {
    return result;
  }
  
  // Shuffle dealers to get random selection
  const shuffledDealers = [...availableDealers].sort(() => Math.random() - 0.5);
  
  // Select a subset based on count (or all if count > available)
  const selectedDealers = shuffledDealers.slice(0, Math.min(count, availableDealers.length));
  
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  // Create activity entries for each selected dealer
  for (const dealer of selectedDealers) {
    const dealerId = (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
                    (dealer.ID ? dealer.ID.toString() : '');
    
    if (!dealerId) continue;
    
    const dealerName = `${dealer.FIRSTNAME || ''} ${dealer.LASTNAME || ''}`.trim();
    const lastBuy = dealer.LASTBUY || formatDateTime(getRandomDate(sixMonthsAgo, now));
    const lastActive = formatDateTime(getRandomDate(sixMonthsAgo, now));
    
    result.push({
      lot_number: lot.lot_number,
      dealer_id: dealerId,
      activity_type: activityType,
      last_active: lastActive,
      last_buy: lastBuy,
      dealer_name: dealerName,
      dealer_type: dealer.TYPE || 'Standard'
    });
  }
  
  return result;
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
    
    // Clear existing data
    console.log('Clearing existing lot_user_activity data');
    const { error: clearError } = await supabaseClient
      .from('lot_user_activity')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    if (clearError) {
      throw new Error(`Error clearing lot_user_activity table: ${clearError.message}`);
    }
    
    // Fetch all lots
    console.log('Fetching lots from database');
    const { data: lots, error: lotsError } = await supabaseClient
      .from('lots')
      .select('*');
      
    if (lotsError) {
      throw new Error(`Error fetching lots: ${lotsError.message}`);
    }
    
    if (!lots || lots.length === 0) {
      throw new Error('No lots found in database');
    }
    
    // Fetch all dealers
    console.log('Fetching dealers from database');
    const { data: dealers, error: dealersError } = await supabaseClient
      .from('loggedInDealers')
      .select('*');
      
    if (dealersError) {
      throw new Error(`Error fetching dealers: ${dealersError.message}`);
    }
    
    if (!dealers || dealers.length === 0) {
      throw new Error('No dealers found in database');
    }
    
    // Generate and insert activity data for each lot
    let totalInserted = 0;
    const errors = [];
    
    for (const lot of lots) {
      try {
        // Generate viewer data
        const viewerData = await generateActivityData(
          supabaseClient, 
          lot, 
          dealers, 
          'viewer', 
          lot.viewers
        );
        
        // Generate watcher data
        const watcherData = await generateActivityData(
          supabaseClient, 
          lot, 
          dealers, 
          'watcher', 
          lot.watchers
        );
        
        // Generate lead data
        const leadData = await generateActivityData(
          supabaseClient, 
          lot, 
          dealers, 
          'lead', 
          lot.lead_list_users
        );
        
        // Generate online user data
        const onlineData = await generateActivityData(
          supabaseClient, 
          lot, 
          dealers, 
          'online', 
          lot.online_users
        );
        
        // Combine all data
        const allActivityData = [
          ...viewerData,
          ...watcherData,
          ...leadData,
          ...onlineData
        ];
        
        if (allActivityData.length > 0) {
          // Insert in batches of 100 to avoid hitting request size limits
          const batchSize = 100;
          for (let i = 0; i < allActivityData.length; i += batchSize) {
            const batch = allActivityData.slice(i, i + batchSize);
            
            const { data: insertedData, error: insertError } = await supabaseClient
              .from('lot_user_activity')
              .insert(batch)
              .select();
              
            if (insertError) {
              errors.push({
                lotNumber: lot.lot_number,
                error: `Failed to insert batch: ${insertError.message}`
              });
            } else {
              totalInserted += batch.length;
            }
          }
        }
        
        console.log(`Processed lot ${lot.lot_number}: added ${allActivityData.length} activity records`);
      } catch (error) {
        errors.push({
          lotNumber: lot.lot_number,
          error: error.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully inserted ${totalInserted} activity records`,
        errors: errors.length > 0 ? errors : undefined
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
    console.error("Error in seed-lot-user-activity function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred'
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
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Define the mock messages directly in the edge function
// This is the same data that was previously in src/app/data/mock-messages.ts
const INITIAL_MESSAGES = [
  {
    id: 'msg1',
    text: 'Important: Please check vehicle documentation before bidding',
    time: '13:04:45',
    alternate: false,
    dealer: 'Michael Brown',
    dealerId: '45678901',
    type: 'VIP',
    isRead: false
  },
  {
    id: 'msg2',
    text: 'All vehicles have been inspected and certified',
    time: '13:03:32',
    alternate: true,
    dealer: 'You',
    dealerId: 'ADMIN',
    type: 'Admin',
    isGlobal: true,
    isRead: true
  },
  {
    id: 'msg3',
    text: 'Question about Lot 7 service history',
    time: '13:02:55',
    alternate: false,
    dealer: 'Sarah Wilson',
    dealerId: '56789012',
    type: 'Premium',
    isRead: false
  },
  {
    id: 'msg4',
    text: 'Interested in multiple lots, any package deals?',
    time: '13:01:22',
    alternate: false,
    dealer: 'Daniel Kim',
    dealerId: 'DK123456',
    type: 'VIP',
    isRead: false
  },
  {
    id: 'msg5',
    text: 'Welcome to today\'s auction. Good luck with your bids!',
    time: '13:00:00',
    alternate: true,
    dealer: 'You',
    dealerId: 'ADMIN',
    type: 'Admin',
    isGlobal: true,
    isRead: true
  },
  {
    id: 'msg6',
    text: 'Need clarification on shipping options',
    time: '12:59:45',
    alternate: false,
    dealer: 'Isabella Garcia',
    dealerId: 'IG345678',
    type: 'VIP',
    isRead: false
  }
];

// Function to insert or update a message
async function upsertMessage(supabase, message) {
  // Convert camelCase to snake_case for database column names
  const dbMessage = {
    id: message.id,  // Keep the original id for messages
    text: message.text,
    time: message.time,
    alternate: message.alternate,
    dealer: message.dealer,
    dealer_id: message.dealerId,
    recipient_id: message.recipientId,
    type: message.type,
    is_global: message.isGlobal,
    is_read: message.isRead
  };

  const { data, error } = await supabase
    .from('messages')
    .upsert(dbMessage, { onConflict: 'id' })
    .select();

  if (error) {
    throw new Error(`Error upserting message ${message.id}: ${error.message}`);
  }

  return data;
}

// Using the built-in Deno.serve instead of the imported serve
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
    
    // Check if messages already exist in the database
    const { data: existingMessages, error: countError } = await supabaseClient
      .from('messages')
      .select('id')
      .limit(1);
      
    if (countError) {
      throw new Error(`Error checking for existing messages: ${countError.message}`);
    }
    
    if (existingMessages && existingMessages.length > 0) {
      console.log('Messages already exist in database, truncating table first');
      
      // Clear the messages table
      const { error: truncateError } = await supabaseClient
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This effectively deletes all records
        
      if (truncateError) {
        throw new Error(`Error truncating messages table: ${truncateError.message}`);
      }
    }
    
    // Process messages - insert or update each message
    const results = [];
    const errors = [];
    
    for (const message of INITIAL_MESSAGES) {
      try {
        const result = await upsertMessage(supabaseClient, message);
        results.push({ id: message.id, result });
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        errors.push({ id: message.id, error: error.message });
      }
    }
    
    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} messages`,
        results,
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
    console.error("Error in seed-messages function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred while seeding messages'
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
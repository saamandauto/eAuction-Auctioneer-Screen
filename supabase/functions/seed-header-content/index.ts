import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Define the header content data for localization
const INITIAL_HEADER_CONTENT = [
  // English (UK) header content
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'viewAuction', value: 'View Auction' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'viewPlannedLots', value: 'View Planned Lots' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'endAuction', value: 'End Auction' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'startAuction', value: 'Start Auction' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'voice', value: 'Voice' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'talk', value: 'Talk' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'toggleVoiceTooltip', value: 'Toggle Voice Assistant' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'creditsErrorTooltip', value: 'ElevenLabs API credits exhausted or API key invalid' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'speechRecognitionTooltip', value: 'Press ALT+T to activate speech recognition' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'settingsTooltip', value: 'Settings' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'header', key: 'helpTooltip', value: 'Help' },

  // Danish (DK) header content
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'viewAuction', value: 'Vis Auktion' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'viewPlannedLots', value: 'Vis Planlagte Lots' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'endAuction', value: 'Afslut Auktion' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'startAuction', value: 'Start Auktion' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'voice', value: 'Stemme' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'talk', value: 'Tal' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'toggleVoiceTooltip', value: 'Skift Stemmeassistent' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'creditsErrorTooltip', value: 'ElevenLabs API-kreditter opbrugt eller API-nøgle ugyldig' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'speechRecognitionTooltip', value: 'Tryk ALT+T for at aktivere taleegenkendelse' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'settingsTooltip', value: 'Indstillinger' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'header', key: 'helpTooltip', value: 'Hjælp' }
];

// Function to insert or update content with robust error handling
async function upsertContent(supabase, contentItem) {
  try {
    const { data, error } = await supabase
      .from('content')
      .upsert(contentItem, { onConflict: 'system,locale,path,filename,key' })
      .select();

    if (error) {
      throw new Error(`Error upserting content item: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`Failed to upsert content item for key ${contentItem.key}:`, error);
    throw error;
  }
}

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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
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
    
    console.log(`Starting header content seeding process with ${INITIAL_HEADER_CONTENT.length} items`);
    
    // Process content items - insert each item
    const results = [];
    const errors = [];
    
    console.log(`Processing ${INITIAL_HEADER_CONTENT.length} header content items...`);
    
    for (let i = 0; i < INITIAL_HEADER_CONTENT.length; i++) {
      const contentItem = INITIAL_HEADER_CONTENT[i];
      const itemKey = `${contentItem.locale}/${contentItem.path}/${contentItem.filename}/${contentItem.key}`;
      
      try {
        console.log(`Processing header item ${i + 1}/${INITIAL_HEADER_CONTENT.length}: ${itemKey}`);
        const result = await upsertContent(supabaseClient, contentItem);
        results.push({ key: itemKey, result });
      } catch (error) {
        console.error(`Error processing header content item ${i + 1}/${INITIAL_HEADER_CONTENT.length} (${itemKey}):`, error);
        errors.push({ key: itemKey, error: error.message });
      }
    }
    
    console.log(`Header content seeding completed. Successfully processed: ${results.length}, Errors: ${errors.length}`);
    
    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${results.length} of ${INITIAL_HEADER_CONTENT.length} header content items`,
        totalItems: INITIAL_HEADER_CONTENT.length,
        successfulItems: results.length,
        failedItems: errors.length,
        results: results.slice(0, 5), // Only return first 5 results to avoid large response
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
    console.error("Error in seed-header-content function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred while seeding header content'
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
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Define the complete initial content data for localization
const INITIAL_CONTENT = [
  // English (UK) content
  // Planned Lots table headers
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'lotNo', value: 'Lot No.' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'vehicle', value: 'Vehicle' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'year', value: 'Year' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'transmission', value: 'Transmission' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'fuel', value: 'Fuel' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'color', value: 'Color' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'mileage', value: 'Mileage' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'location', value: 'Location' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'registration', value: 'Registration' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'reservePrice', value: 'Reserve Price' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'askingPrice', value: 'Asking Price' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'lastAuction', value: 'Last Auction' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'indicataPrice', value: 'Indicata Price' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'dealerActivity', value: 'Dealer Activity' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'title', value: 'Planned Lots' },
  
  // Planned Lots UI elements
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'reorderHeader', value: 'Reorder' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'disableReordering', value: 'Disable Reordering' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'reorderLots', value: 'Reorder Lots' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'detailedView', value: 'Detailed View' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'compactView', value: 'Compact View' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'lotsCountSuffix', value: 'lots' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'dragPreviewLot', value: 'Lot' },
  
  // Planned Lots tooltips
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'viewersTooltip', value: 'Viewers: Dealers who have viewed the detail page of this lot' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'watchersTooltip', value: 'Watchers: Dealers who have marked this lot as a favorite' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'leadsTooltip', value: 'Leads: Dealers who are on the lead list' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'planned-lots', key: 'onlineUsersTooltip', value: 'Online Users: Dealers who are currently online and viewing this lot' },
  
  // Vehicle Details tooltips
  { system: 1, locale: 'en_GB', path: 'components', filename: 'vehicle-details', key: 'viewersTooltip', value: 'Viewers: Dealers who have viewed the detail page of this lot' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'vehicle-details', key: 'watchersTooltip', value: 'Watchers: Dealers who have marked this lot as a favorite' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'vehicle-details', key: 'leadsTooltip', value: 'Leads: Dealers who are on the lead list' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'vehicle-details', key: 'onlineUsersTooltip', value: 'Online Users: Dealers who are currently online and viewing this lot' },
  
  // Shared components
  { system: 1, locale: 'en_GB', path: 'components', filename: 'shared', key: 'mileageUnit', value: 'km' },
  
  // Settings panel content
  { system: 1, locale: 'en_GB', path: 'components', filename: 'settings-panel', key: 'languageTab', value: 'Language' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'settings-panel', key: 'selectLanguage', value: 'Select Language' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'settings-panel', key: 'english', value: 'English (UK)' },
  { system: 1, locale: 'en_GB', path: 'components', filename: 'settings-panel', key: 'danish', value: 'Danish (DK)' },

  // Danish (DK) content
  // Planned Lots table headers
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'lotNo', value: 'Lot Nr.' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'vehicle', value: 'Køretøj' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'year', value: 'År' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'transmission', value: 'Transmission' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'fuel', value: 'Brændstof' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'color', value: 'Farve' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'mileage', value: 'Kilometerstand' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'location', value: 'Placering' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'registration', value: 'Registrering' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'reservePrice', value: 'Mindstepris' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'askingPrice', value: 'Udbudspris' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'lastAuction', value: 'Sidste Auktion' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'indicataPrice', value: 'Indicata Pris' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'dealerActivity', value: 'Forhandler Aktivitet' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'title', value: 'Planlagte Lots' },
  
  // Planned Lots UI elements (Danish)
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'reorderHeader', value: 'Omarranger' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'disableReordering', value: 'Deaktiver Omarrangering' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'reorderLots', value: 'Omarranger Lots' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'detailedView', value: 'Detaljeret Visning' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'compactView', value: 'Kompakt Visning' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'lotsCountSuffix', value: 'lots' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'dragPreviewLot', value: 'Lot' },
  
  // Planned Lots tooltips (Danish)
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'viewersTooltip', value: 'Seere: Forhandlere som har set detaljerne for dette lot' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'watchersTooltip', value: 'Overvågere: Forhandlere som har markeret dette lot som favorit' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'leadsTooltip', value: 'Leads: Forhandlere som er på leadlisten' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'planned-lots', key: 'onlineUsersTooltip', value: 'Online Brugere: Forhandlere som er online og ser dette lot' },
  
  // Vehicle Details tooltips (Danish)
  { system: 1, locale: 'da_DK', path: 'components', filename: 'vehicle-details', key: 'viewersTooltip', value: 'Seere: Forhandlere som har set detaljerne for dette lot' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'vehicle-details', key: 'watchersTooltip', value: 'Overvågere: Forhandlere som har markeret dette lot som favorit' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'vehicle-details', key: 'leadsTooltip', value: 'Leads: Forhandlere som er på leadlisten' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'vehicle-details', key: 'onlineUsersTooltip', value: 'Online Brugere: Forhandlere som er online og ser dette lot' },
  
  // Shared components (Danish)
  { system: 1, locale: 'da_DK', path: 'components', filename: 'shared', key: 'mileageUnit', value: 'km' },
  
  // Settings panel content (Danish)
  { system: 1, locale: 'da_DK', path: 'components', filename: 'settings-panel', key: 'languageTab', value: 'Sprog' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'settings-panel', key: 'selectLanguage', value: 'Vælg Sprog' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'settings-panel', key: 'english', value: 'Engelsk (UK)' },
  { system: 1, locale: 'da_DK', path: 'components', filename: 'settings-panel', key: 'danish', value: 'Dansk (DK)' }
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
    
    console.log(`Starting content seeding process with ${INITIAL_CONTENT.length} items`);
    
    // Clear existing content first
    console.log('Clearing existing content from database');
    const { error: clearError } = await supabaseClient
      .from('content')
      .delete()
      .neq('system', -1); // This effectively deletes all records
        
    if (clearError) {
      throw new Error(`Error clearing content table: ${clearError.message}`);
    }
    
    console.log('Content table cleared successfully');
    
    // Process content items - insert each item
    const results = [];
    const errors = [];
    
    console.log(`Processing ${INITIAL_CONTENT.length} content items...`);
    
    for (let i = 0; i < INITIAL_CONTENT.length; i++) {
      const contentItem = INITIAL_CONTENT[i];
      const itemKey = `${contentItem.locale}/${contentItem.path}/${contentItem.filename}/${contentItem.key}`;
      
      try {
        console.log(`Processing item ${i + 1}/${INITIAL_CONTENT.length}: ${itemKey}`);
        const result = await upsertContent(supabaseClient, contentItem);
        results.push({ key: itemKey, result });
      } catch (error) {
        console.error(`Error processing content item ${i + 1}/${INITIAL_CONTENT.length} (${itemKey}):`, error);
        errors.push({ key: itemKey, error: error.message });
      }
    }
    
    console.log(`Content seeding completed. Successfully processed: ${results.length}, Errors: ${errors.length}`);
    
    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${results.length} of ${INITIAL_CONTENT.length} content items`,
        totalItems: INITIAL_CONTENT.length,
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
    console.error("Error in seed-content function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred while seeding content'
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
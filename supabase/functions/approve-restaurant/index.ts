import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { requestId, requestData } = await req.json()

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.some(u => u.email === requestData.email)

    let authUser
    if (userExists) {
      // Get existing user
      const existingUserData = existingUser.users.find(u => u.email === requestData.email)
      authUser = { user: existingUserData }
    } else {
      // Create new auth user for restaurant admin
      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: requestData.email,
        password: 'TempPass123!', // Temporary password - user should reset
        user_metadata: {
          name: requestData.owner_name,
          role: 'admin'
        },
        email_confirm: true
      })

      if (authError) {
        throw authError
      }
      authUser = newAuthUser
    }

    // Create the restaurant
    const { data: restaurantData, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: requestData.restaurant_name,
        domain: requestData.domain,
        address: requestData.address,
        phone: requestData.phone,
        email: requestData.email,
        admin_id: authUser.user.id,
        business_type: requestData.business_type
      })
      .select()
      .single()

    if (restaurantError) {
      throw restaurantError
    }

    // Create the user profile
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        restaurant_id: restaurantData.id,
        email: requestData.email,
        name: requestData.owner_name,
        role: 'admin',
        phone: requestData.phone
      })

    if (userError) {
      throw userError
    }

    // Update the request status to approved
    const { error: updateError } = await supabaseAdmin
      .from('restaurant_requests')
      .update({ 
        status: 'approved', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId)

    if (updateError) {
      throw updateError
    }

    // Send approval email (you can implement this later)
    console.log(`Restaurant ${requestData.restaurant_name} approved and created`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        restaurant: restaurantData,
        message: 'Restaurant approved and created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error approving restaurant:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
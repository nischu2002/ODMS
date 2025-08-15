
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

    const { requestId, requestData, action, restaurantId, updates } = await req.json()

    // Handle different actions
    if (action === 'update_restaurant') {
      // Update restaurant details
      const { error: updateError } = await supabaseAdmin
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId)

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Restaurant updated successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'delete_restaurant') {
      // Delete restaurant and associated data
      const { error: deleteError } = await supabaseAdmin
        .from('restaurants')
        .delete()
        .eq('id', restaurantId)

      if (deleteError) {
        throw deleteError
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Restaurant deleted successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'reset_password') {
      // Reset restaurant admin password
      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
        updates.admin_id,
        { password: updates.new_password }
      )

      if (resetError) {
        throw resetError
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password reset successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Default approve restaurant action
    if (!requestId || !requestData) {
      throw new Error('Missing requestId or requestData')
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    let authUser = existingUsers.users.find(u => u.email === requestData.email)

    if (!authUser) {
      // Create new auth user with a default password that user can change
      const defaultPassword = 'Restaurant123!'
      
      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: requestData.email,
        password: defaultPassword,
        user_metadata: {
          name: requestData.owner_name,
          role: 'admin'
        },
        email_confirm: true
      })

      if (authError) {
        throw authError
      }
      authUser = newAuthUser.user
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
        admin_id: authUser.id,
        business_type: requestData.business_type
      })
      .select()
      .single()

    if (restaurantError) {
      throw restaurantError
    }

    // Create or update the user profile
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUser.id,
        restaurant_id: restaurantData.id,
        email: requestData.email,
        name: requestData.owner_name,
        role: 'admin',
        phone: requestData.phone,
        is_active: true
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

    console.log(`Restaurant ${requestData.restaurant_name} approved and created`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        restaurant: restaurantData,
        defaultPassword: 'Restaurant123!',
        message: 'Restaurant approved and created successfully. Default password is: Restaurant123!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in approve-restaurant function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

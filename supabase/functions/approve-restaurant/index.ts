
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, requestId, requestData, restaurantId, updates } = await req.json()

    if (action === 'delete_restaurant') {
      console.log('Deleting restaurant:', restaurantId)
      
      // Get restaurant details first
      const { data: restaurant, error: fetchError } = await supabaseClient
        .from('restaurants')
        .select('admin_id')
        .eq('id', restaurantId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch restaurant: ${fetchError.message}`)
      }

      // Delete the restaurant (cascade will handle related data)
      const { error: deleteError } = await supabaseClient
        .from('restaurants')
        .delete()
        .eq('id', restaurantId)

      if (deleteError) {
        throw new Error(`Failed to delete restaurant: ${deleteError.message}`)
      }

      // Try to delete the auth user if admin_id exists
      if (restaurant.admin_id) {
        try {
          const { error: authError } = await supabaseClient.auth.admin.deleteUser(restaurant.admin_id)
          if (authError) {
            console.warn('Failed to delete auth user:', authError.message)
          }
        } catch (authErr) {
          console.warn('Auth user deletion failed:', authErr)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Restaurant deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create_restaurant') {
      console.log('Creating restaurant directly:', requestData)
      
      // Create auth user first
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: requestData.email,
        password: requestData.password,
        email_confirm: true
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      // Create restaurant
      const { data: restaurantData, error: restaurantError } = await supabaseClient
        .from('restaurants')
        .insert({
          name: requestData.restaurant_name,
          domain: requestData.domain,
          address: requestData.address,
          phone: requestData.phone,
          email: requestData.email,
          business_type: requestData.business_type,
          admin_id: authData.user.id,
          is_active: true
        })
        .select()
        .single()

      if (restaurantError) {
        // Cleanup auth user if restaurant creation fails
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Failed to create restaurant: ${restaurantError.message}`)
      }

      // Create user profile
      const { error: userError } = await supabaseClient
        .from('users')
        .insert({
          id: authData.user.id,
          restaurant_id: restaurantData.id,
          name: requestData.owner_name,
          email: requestData.email,
          phone: requestData.phone,
          role: 'admin',
          is_active: true
        })

      if (userError) {
        console.error('Failed to create user profile:', userError.message)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Restaurant created successfully',
          restaurant: restaurantData,
          loginCredentials: {
            email: requestData.email,
            domain: requestData.domain
          },
          defaultPassword: requestData.password
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update_restaurant') {
      console.log('Updating restaurant:', restaurantId, updates)
      
      const { error: updateError } = await supabaseClient
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId)

      if (updateError) {
        throw new Error(`Failed to update restaurant: ${updateError.message}`)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Restaurant updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'reset_password') {
      console.log('Resetting password for admin:', updates.admin_id)
      
      const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
        updates.admin_id,
        { password: updates.new_password }
      )

      if (resetError) {
        throw new Error(`Failed to reset password: ${resetError.message}`)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password reset successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Original approval logic
    console.log('Processing restaurant request:', requestId)
    
    // Create auth user first
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password || 'TempPassword123!',
      email_confirm: true
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    // Create restaurant
    const { data: restaurantData, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .insert({
        name: requestData.restaurant_name,
        domain: requestData.domain,
        address: requestData.address,
        phone: requestData.phone,
        email: requestData.email,
        business_type: requestData.business_type,
        admin_id: authData.user.id,
        is_active: true
      })
      .select()
      .single()

    if (restaurantError) {
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create restaurant: ${restaurantError.message}`)
    }

    // Create user profile
    const { error: userError } = await supabaseClient
      .from('users')
      .insert({
        id: authData.user.id,
        restaurant_id: restaurantData.id,
        name: requestData.owner_name,
        email: requestData.email,
        phone: requestData.phone,
        role: 'admin',
        is_active: true
      })

    if (userError) {
      console.error('Failed to create user profile:', userError.message)
    }

    // Update request status
    const { error: updateError } = await supabaseClient
      .from('restaurant_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)

    if (updateError) {
      console.error('Failed to update request status:', updateError.message)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Restaurant approved successfully',
        restaurant: restaurantData,
        loginCredentials: {
          email: requestData.email,
          domain: requestData.domain
        },
        defaultPassword: requestData.password || 'TempPassword123!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

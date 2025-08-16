
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

    console.log('Received request:', { action, requestId, restaurantId })

    // Handle different actions
    if (action === 'create_restaurant') {
      console.log('Creating new restaurant directly:', requestData)
      
      // Check if user already exists by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      let existingUser = existingUsers.users.find(u => u.email === requestData.email)

      let authUser;
      const userPassword = requestData.password || 'TempPass123!'

      if (existingUser) {
        console.log('User already exists, updating password:', existingUser.id)
        // Update existing user's password
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { 
            password: userPassword,
            user_metadata: {
              name: requestData.owner_name,
              role: 'admin'
            }
          }
        )

        if (updateError) {
          console.error('Error updating existing user:', updateError)
          throw updateError
        }
        authUser = updatedUser.user
      } else {
        console.log('Creating new user for direct restaurant creation')
        // Create new auth user
        const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: requestData.email,
          password: userPassword,
          user_metadata: {
            name: requestData.owner_name,
            role: 'admin'
          },
          email_confirm: true
        })

        if (authError) {
          console.error('Error creating auth user:', authError)
          throw authError
        }
        authUser = newAuthUser.user
      }

      if (!authUser) {
        throw new Error('Failed to create or update auth user')
      }

      console.log('Auth user ready:', authUser.id)

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
        console.error('Error creating restaurant:', restaurantError)
        throw restaurantError
      }

      console.log('Restaurant created:', restaurantData.id)

      // Create the user profile
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
        console.error('Error creating user profile:', userError)
        throw userError
      }

      console.log('User profile created successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          restaurant: restaurantData,
          message: `Restaurant ${requestData.restaurant_name} created successfully!`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'update_restaurant') {
      console.log('Updating restaurant with:', updates)
      // Update restaurant details
      const { error: updateError } = await supabaseAdmin
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId)

      if (updateError) {
        console.error('Error updating restaurant:', updateError)
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
      console.log('Deleting restaurant:', restaurantId)
      // First delete associated users
      const { error: deleteUsersError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('restaurant_id', restaurantId)

      if (deleteUsersError) {
        console.error('Error deleting users:', deleteUsersError)
      }

      // Delete restaurant
      const { error: deleteError } = await supabaseAdmin
        .from('restaurants')
        .delete()
        .eq('id', restaurantId)

      if (deleteError) {
        console.error('Error deleting restaurant:', deleteError)
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
      console.log('Resetting password for admin:', updates.admin_id)
      // Reset restaurant admin password
      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
        updates.admin_id,
        { password: updates.new_password }
      )

      if (resetError) {
        console.error('Error resetting password:', resetError)
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

    console.log('Approving restaurant request:', requestData)

    // Check if user already exists by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    let existingUser = existingUsers.users.find(u => u.email === requestData.email)

    let authUser;
    const userPassword = requestData.password || 'TempPass123!'

    if (existingUser) {
      console.log('User already exists, updating password:', existingUser.id)
      // Update existing user's password
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: userPassword,
          user_metadata: {
            name: requestData.owner_name,
            role: 'admin'
          }
        }
      )

      if (updateError) {
        console.error('Error updating existing user:', updateError)
        throw updateError
      }
      authUser = updatedUser.user
    } else {
      console.log('Creating new user for restaurant approval')
      // Create new auth user
      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: requestData.email,
        password: userPassword,
        user_metadata: {
          name: requestData.owner_name,
          role: 'admin'
        },
        email_confirm: true
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        throw authError
      }
      authUser = newAuthUser.user
    }

    if (!authUser) {
      throw new Error('Failed to create or update auth user')
    }

    console.log('Auth user ready:', authUser.id)

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
      console.error('Error creating restaurant:', restaurantError)
      throw restaurantError
    }

    console.log('Restaurant created:', restaurantData.id)

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
      console.error('Error creating user profile:', userError)
      throw userError
    }

    console.log('User profile created successfully')

    // Update the request status to approved
    const { error: updateError } = await supabaseAdmin
      .from('restaurant_requests')
      .update({ 
        status: 'approved', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating request status:', updateError)
      throw updateError
    }

    // Create notification for super admins
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        notification_type: 'restaurant_approved',
        message: `Restaurant ${requestData.restaurant_name} has been approved and is now active`,
        status: 'pending'
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    console.log(`Restaurant ${requestData.restaurant_name} approved and created successfully`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        restaurant: restaurantData,
        adminPassword: userPassword,
        loginCredentials: {
          email: requestData.email,
          password: userPassword,
          domain: requestData.domain
        },
        message: `Restaurant approved successfully! Login credentials - Email: ${requestData.email}, Password: [Password set during registration], Domain: ${requestData.domain}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in approve-restaurant function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

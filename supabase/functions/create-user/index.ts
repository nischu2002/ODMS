
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

    const { email, password, name, role, phone, restaurant_id } = await req.json()

    console.log('Creating user with data:', { email, name, role, restaurant_id })

    if (!email || !password || !name || !role || !restaurant_id) {
      throw new Error('Missing required fields: email, password, name, role, restaurant_id')
    }

    // Validate the restaurant exists and is active
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('id, is_active')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      console.error('Restaurant validation error:', restaurantError)
      throw new Error('Invalid restaurant ID or restaurant not found')
    }

    if (!restaurant.is_active) {
      throw new Error('Restaurant is not active')
    }

    // Check if user already exists by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === email)

    if (existingUser) {
      // Check if user already has a profile in any restaurant
      const { data: existingProfile } = await supabaseAdmin
        .from('users')
        .select('id, restaurant_id')
        .eq('id', existingUser.id)
        .maybeSingle()

      if (existingProfile) {
        throw new Error('User with this email already exists in the system')
      }
    }

    let authUserId;

    if (existingUser) {
      console.log('Using existing auth user:', existingUser.id)
      authUserId = existingUser.id
      
      // Update user metadata and password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          user_metadata: {
            name,
            role
          }
        }
      )

      if (updateError) {
        console.error('Error updating user metadata:', updateError)
        throw new Error(`Failed to update user metadata: ${updateError.message}`)
      }
    } else {
      console.log('Creating new auth user')
      // Create the auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          name,
          role
        },
        email_confirm: true // Auto-confirm email
      })

      if (authError) {
        console.error('Auth creation error:', authError)
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      if (!authUser.user) {
        throw new Error('Auth user creation returned no user data')
      }

      authUserId = authUser.user.id
      console.log('Auth user created successfully:', authUserId)
    }

    // Create the user profile in the users table
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        restaurant_id,
        email,
        name,
        role,
        phone: phone || null,
        is_active: true
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user profile:', userError)
      
      // If profile creation fails and we created a new auth user, clean it up
      if (!existingUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId)
          console.log('Cleaned up auth user after profile creation failure')
        } catch (cleanupError) {
          console.error('Error cleaning up auth user:', cleanupError)
        }
      }
      
      throw new Error(`Failed to create user profile: ${userError.message}`)
    }

    console.log('User profile created successfully')

    // Create notification for restaurant admin
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        notification_type: 'user_created',
        message: `New ${role} account created for ${name}`,
        status: 'pending'
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authUserId,
          email: email,
          name,
          role,
          restaurant_id
        },
        message: 'User created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating user:', error)
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

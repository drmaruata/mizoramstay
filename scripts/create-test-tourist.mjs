/**
 * create-test-tourist.mjs
 * Creates a test TOURIST user so the booking flow can be validated end-to-end.
 *
 * Usage: node --env-file=.env scripts/create-test-tourist.mjs
 * Requires .env with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'tourist@mizoramstay.test'
const TEST_PASSWORD = 'TouristTest123!'
const TEST_NAME = 'Test Tourist'

async function main() {
  // 1. Create (or find) the test tourist user via the admin API (bypasses email confirmation)
  let userId
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const found = existing?.users?.find((u) => u.email === TEST_EMAIL)
  if (found) {
    userId = found.id
    console.log(`User already exists: ${TEST_EMAIL} (${userId})`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: 'Test', last_name: 'Tourist' },
    })
    if (error) {
      console.error('Failed to create user:', error.message)
      process.exit(1)
    }
    userId = data.user.id
    console.log(`Created user: ${TEST_EMAIL} (${userId})`)
  }

  // 2. Ensure the profile has role TOURIST (the trigger sets TOURIST by default)
  const { error: profileErr } = await admin
    .from('profiles')
    .update({ role: 'TOURIST', first_name: 'Test', last_name: 'Tourist' })
    .eq('id', userId)
  if (profileErr) {
    console.error('Failed to set role:', profileErr.message)
    process.exit(1)
  }

  console.log(`Test tourist ready: ${TEST_EMAIL} / ${TEST_PASSWORD} (role=TOURIST)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
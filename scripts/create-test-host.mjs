/**
 * create-test-host.mjs
 * Creates a test HOST user + host profile + a PENDING_REVIEW property
 * so the admin approve/reject flow can be tested end-to-end.
 *
 * Usage: node scripts/create-test-host.mjs
 * Requires .env with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'host@mizoramstay.test'
const TEST_PASSWORD = 'HostTest123!'
const TEST_NAME = 'Test Host User'

async function main() {
  // 1. Create (or find) the test host user via the admin API (bypasses email confirmation)
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
      user_metadata: { first_name: 'Test', last_name: 'Host' },
    })
    if (error) {
      console.error('Failed to create user:', error.message)
      process.exit(1)
    }
    userId = data.user.id
    console.log(`Created user: ${TEST_EMAIL} (${userId})`)
  }

  // 2. Ensure the profile has role HOST (the trigger sets TOURIST by default)
  const { error: profileErr } = await admin
    .from('profiles')
    .update({ role: 'HOST', first_name: 'Test', last_name: 'Host' })
    .eq('id', userId)
  if (profileErr) {
    console.error('Failed to update profile role:', profileErr.message)
    process.exit(1)
  }
  console.log('Profile role set to HOST')

  // 3. Ensure a host_profiles row exists
  let hostProfileId
  const { data: hp } = await admin.from('host_profiles').select('id').eq('user_id', userId).maybeSingle()
  if (!hp) {
    const { data: newHp, error: hpErr } = await admin.from('host_profiles').insert({
      user_id: userId,
      display_name: TEST_NAME,
      bio: 'Test host created for the Shadcn migration verification flow.',
      identity_status: 'VERIFIED',
      bank_account_status: 'PENDING',
    }).select('id').single()
    if (hpErr) {
      console.error('Failed to create host profile:', hpErr.message)
      process.exit(1)
    }
    hostProfileId = newHp.id
    console.log('Host profile created')
  } else {
    hostProfileId = hp.id
    console.log('Host profile already exists')
  }

  // 4. Create a PENDING_REVIEW property for this host (if none pending exists)
  const { data: pendingProps } = await admin
    .from('properties')
    .select('id')
    .eq('host_id', hostProfileId)
    .eq('status', 'PENDING_REVIEW')
    .limit(1)
  if (pendingProps && pendingProps.length > 0) {
    console.log('A PENDING_REVIEW property already exists for this host')
  } else {
    const slug = 'shadcn-test-homestay-' + Date.now().toString(36)
    const { data: prop, error: propErr } = await admin.from('properties').insert({
      host_id: hostProfileId,
      name: 'Shadcn Test Homestay',
      slug,
      property_type: 'HOMESTAY',
      description: 'A test property created to verify the admin approve/reject flow after the Shadcn migration.',
      address: 'Test Address, Aizawl',
      village: 'Aizawl',
      town: 'Aizawl',
      district: 'Aizawl',
      pincode: '796001',
      latitude: 23.7271,
      longitude: 92.7176,
      status: 'PENDING_REVIEW',
      verification_level: 1,
      tourism_registration_number: 'TR-TEST-001',
      tourism_registration_status: 'PENDING',
    }).select('id, name, status').single()
    if (propErr) {
      console.error('Failed to create property:', propErr.message)
      process.exit(1)
    }
    console.log(`Created PENDING_REVIEW property: ${prop.name} (${prop.id})`)
  }

  console.log('\n✅ Test host setup complete.')
  console.log(`   Email:    ${TEST_EMAIL}`)
  console.log(`   Password: ${TEST_PASSWORD}`)
  console.log('   Role:     HOST')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

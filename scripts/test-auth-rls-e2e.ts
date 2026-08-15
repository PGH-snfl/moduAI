import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const projectUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = projectUrl?.match(/^https:\/\/([^.]+)\.supabase\.co$/)?.[1];

if (!projectUrl || !anonKey || !accessToken || !projectRef) {
  throw new Error('Supabase test environment variables are missing.');
}

type ApiKey = { name?: string; type?: string; api_key?: string };

async function getServiceRoleKey() {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Could not load project API keys (${response.status}).`);
  const keys = await response.json() as ApiKey[];
  const serviceRole = keys.find((key) => key.name === 'service_role' || key.type === 'service_role');
  if (!serviceRole?.api_key) throw new Error('Service role key was not returned.');
  return serviceRole.api_key;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const serviceRoleKey = await getServiceRoleKey();
  const adminClient = createClient(projectUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const suffix = `${Date.now()}-${randomBytes(3).toString('hex')}`;
  const password = `Rls!${randomBytes(12).toString('base64url')}aA1`;
  const normalEmail = `moduai-rls-normal-${suffix}@example.com`;
  const adminEmail = `moduai-rls-admin-${suffix}@example.com`;
  const createdUserIds: string[] = [];

  try {
    const normalCreated = await adminClient.auth.admin.createUser({
      email: normalEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'RLS 일반 테스트', onboarding_completed: true },
    });
    if (normalCreated.error) throw normalCreated.error;
    assert(normalCreated.data.user, 'Normal test user was not created.');
    createdUserIds.push(normalCreated.data.user.id);

    const adminCreated = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'RLS 관리자 테스트', onboarding_completed: true },
      app_metadata: { role: 'admin' },
    });
    if (adminCreated.error) throw adminCreated.error;
    assert(adminCreated.data.user, 'Admin test user was not created.');
    createdUserIds.push(adminCreated.data.user.id);

    const normalClient = createClient(projectUrl, anonKey, { auth: { persistSession: false } });
    const roleClient = createClient(projectUrl, anonKey, { auth: { persistSession: false } });
    const normalLogin = await normalClient.auth.signInWithPassword({ email: normalEmail, password });
    const adminLogin = await roleClient.auth.signInWithPassword({ email: adminEmail, password });
    if (normalLogin.error) throw normalLogin.error;
    if (adminLogin.error) throw adminLogin.error;
    assert(normalLogin.data.user?.app_metadata?.role !== 'admin', 'Normal user unexpectedly has admin role.');
    assert(adminLogin.data.user?.app_metadata?.role === 'admin', 'Admin app_metadata claim is missing.');

    const ownProfile = await normalClient.from('user_profiles').select('id').eq('id', normalCreated.data.user.id);
    if (ownProfile.error) throw ownProfile.error;
    assert(ownProfile.data.length === 1, 'Normal user cannot read own profile.');

    const otherProfile = await normalClient.from('user_profiles').select('id').eq('id', adminCreated.data.user.id);
    if (otherProfile.error) throw otherProfile.error;
    assert(otherProfile.data.length === 0, 'Normal user can read another profile.');

    const regularPending = await normalClient.from('pending_tools').select('id', { count: 'exact', head: true });
    if (regularPending.error) throw regularPending.error;
    assert(regularPending.count === 0, 'Normal user can read pending submissions.');

    const adminPending = await roleClient.from('pending_tools').select('id', { count: 'exact', head: true });
    if (adminPending.error) throw adminPending.error;
    assert(adminPending.count !== null, 'Admin cannot query pending submissions.');

    const tool = await adminClient.from('tools').select('id').limit(1).maybeSingle();
    if (tool.error) throw tool.error;
    assert(tool.data, 'No tool exists for favorite RLS test.');

    const favorite = await normalClient.from('user_favorites').insert({
      user_id: normalCreated.data.user.id,
      tool_id: tool.data.id,
    }).select('user_id, tool_id').single();
    if (favorite.error) throw favorite.error;

    const ownFavorite = await normalClient.from('user_favorites').select('user_id').eq('user_id', normalCreated.data.user.id);
    if (ownFavorite.error) throw ownFavorite.error;
    assert(ownFavorite.data.length === 1, 'Normal user cannot read own favorite.');

    const hiddenFavorite = await roleClient.from('user_favorites').select('user_id').eq('user_id', normalCreated.data.user.id);
    if (hiddenFavorite.error) throw hiddenFavorite.error;
    assert(hiddenFavorite.data.length === 0, 'A different user can read another user favorite.');

    const foreignFavorite = await normalClient.from('user_favorites').insert({
      user_id: adminCreated.data.user.id,
      tool_id: tool.data.id,
    });
    assert(Boolean(foreignFavorite.error), 'Normal user can create a favorite for another user.');

    console.log('PASS email/password login for temporary confirmed users');
    console.log('PASS admin role is read from app_metadata');
    console.log('PASS profile owner-only SELECT');
    console.log('PASS pending submissions hidden from normal users and visible to admins');
    console.log('PASS favorites owner-only INSERT/SELECT');
  } finally {
    for (const userId of createdUserIds.reverse()) {
      const deleted = await adminClient.auth.admin.deleteUser(userId);
      if (deleted.error) console.error(`Cleanup failed for temporary user ${userId}: ${deleted.error.message}`);
    }
  }
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

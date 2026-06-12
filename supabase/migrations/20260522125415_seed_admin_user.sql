-- Seed an admin user from Vault secrets `admin_email` and `admin_password`.
-- Idempotent: re-applies safely; updates metadata if the user already exists.
-- Skips silently if either secret is missing (e.g. local dev without Vault entries).

-- pgcrypto lives in the `extensions` schema on Supabase and is not on the default
-- search_path; qualify crypt()/gen_salt() explicitly so this works regardless of role.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_email     text;
  v_password  text;
  v_user_id   uuid;
  v_now       timestamptz := now();
BEGIN
  SELECT decrypted_secret INTO v_email
  FROM vault.decrypted_secrets
  WHERE name = 'admin_email';

  SELECT decrypted_secret INTO v_password
  FROM vault.decrypted_secrets
  WHERE name = 'admin_password';

  IF v_email IS NULL OR btrim(v_email) = ''
     OR v_password IS NULL OR btrim(v_password) = '' THEN
    RAISE NOTICE 'seed_admin_user: vault secrets admin_email/admin_password missing; skipping';
    RETURN;
  END IF;

  v_email := lower(btrim(v_email));

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      v_now,
      jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', 'admin'
      ),
      jsonb_build_object(
        'name', 'Admin',
        'role', 'admin'
      ),
      v_now,
      v_now,
      '',
      '',
      '',
      ''
    );

    -- Required on modern GoTrue for email/password sign-in.
    INSERT INTO auth.identities (
      id,
      user_id,
      provider,
      provider_id,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'email',
      v_user_id::text,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      v_now,
      v_now,
      v_now
    );

    RAISE NOTICE 'seed_admin_user: created admin user %', v_email;
  ELSE
    UPDATE auth.users
    SET
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                          || jsonb_build_object('role', 'admin'),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                           || jsonb_build_object('role', 'admin'),
      updated_at = v_now
    WHERE id = v_user_id;

    RAISE NOTICE 'seed_admin_user: promoted existing user % to admin', v_email;
  END IF;

  -- Ensure profiles row exists (the AFTER INSERT trigger on auth.users only fires
  -- on the initial insert; for an already-existing user without a profile row this
  -- backfills it).
  INSERT INTO public.profiles (id, name, email)
  VALUES (v_user_id, 'Admin', v_email)
  ON CONFLICT (id) DO NOTHING;
END$$;

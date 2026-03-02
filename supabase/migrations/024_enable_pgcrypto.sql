-- Required for seed.sql (gen_salt, crypt for auth.users)
create extension if not exists pgcrypto with schema extensions;

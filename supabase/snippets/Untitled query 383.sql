

insert into membros_empresa (empresa_id, user_id, role)
  values ('00000000-0000-0000-0000-000000000001', '4a07b8e8-13de-4640-a05a-7dd2a7c0096b', 'admin');

   insert into membros_empresa (empresa_id, user_id, role)
  select
    '00000000-0000-0000-0000-000000000001',
    id,
    'admin'
  from auth.users
  where email = 'michaellscorreia1@gmail.com'
  on conflict (empresa_id, user_id) do nothing;
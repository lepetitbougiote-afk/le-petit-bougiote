drop policy if exists "super admins manage user roles" on public.user_roles;

create policy "admins manage user roles"
on public.user_roles
for all
using (public.is_admin())
with check (public.is_admin());

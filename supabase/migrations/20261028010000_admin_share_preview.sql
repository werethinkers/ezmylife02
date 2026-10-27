-- Lets admins save the link preview (og_image, share_prefs) on any instant page.
-- The ip_pages_guard trigger still resets owner, status, slug, published_content,
-- share_url and the other protected columns on any non-trusted update, so this
-- does not let an admin change who owns a page or what is published.
drop policy if exists "ip_pages: admin edits share" on public.ip_pages;
create policy "ip_pages: admin edits share" on public.ip_pages
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

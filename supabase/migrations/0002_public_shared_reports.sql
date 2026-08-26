create policy reports_public_shared_read_existing on public.reports for select using (
  exists (
    select 1 from public.share_links
    where share_links.report_id = reports.id
      and share_links.revoked_at is null
      and (share_links.expires_at is null or share_links.expires_at > now())
  )
);

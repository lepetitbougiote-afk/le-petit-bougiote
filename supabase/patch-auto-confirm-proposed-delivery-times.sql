create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

alter table public.orders
  alter column customer_can_cancel_until
  set default (timezone('utc', now()) + interval '5 minutes');

update public.orders
set customer_can_cancel_until =
  case
    when confirmation_status = 'time_adjustment_requested'
      then coalesce(last_customer_notification_at, updated_at, created_at) + interval '5 minutes'
    else created_at + interval '5 minutes'
  end
where fulfillment_type = 'delivery'
  and customer_can_cancel_until is not null
  and (
    status in ('pending', 'pending_payment', 'awaiting_restaurant_confirmation', 'time_adjustment_requested')
    or confirmation_status in ('pending', 'time_adjustment_requested')
  );

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'auto-confirm-delivery-times-every-minute';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
exception
  when undefined_table then
    null;
end
$$;

select
  cron.schedule(
    'auto-confirm-delivery-times-every-minute',
    '* * * * *',
    $$
    select
      net.http_post(
        url:='https://wjjwvmlplqrfbsvrwdvv.supabase.co/functions/v1/auto-confirm-delivery-times',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'sb_publishable_qhD5KXfmfPeQA5N__rqC4w_8ejsox2O'
        ),
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

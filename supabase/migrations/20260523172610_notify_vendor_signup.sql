CREATE OR REPLACE FUNCTION public.notify_vendor_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  perform http_post(
    'https://wtlwtjwlvvtrxprlwnqv.supabase.co/functions/v1/send-vendor-confirmation',
    json_build_object('record', row_to_json(NEW))::text,
    'application/json'
  );
  return NEW;
end;
$function$;
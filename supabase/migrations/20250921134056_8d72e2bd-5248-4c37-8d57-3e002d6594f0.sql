-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the CRON job to send email reminders every minute
SELECT cron.schedule(
  'send-study-reminders',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://vceykfjjukymyxrylaeo.supabase.co/functions/v1/send-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZXlrZmpqdWt5bXl4cnlsYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxODU0MDUsImV4cCI6MjA3Mzc2MTQwNX0._Gr3612xE9ai_Eqaejvofq9kvuleIX39hIxMpQzfjzs"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
-- Add optional description field to tasks.
-- Existing rows get NULL (treated as empty in the app). Safe to run on live data.
alter table tasks add column if not exists description text;

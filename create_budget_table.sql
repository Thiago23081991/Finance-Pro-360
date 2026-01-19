-- Create table for Budget Limits
create table if not exists budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  category text not null,
  amount numeric not null,
  alert_threshold numeric default 80,
  created_at timestamp with time zone default now(),
  unique(user_id, category)
);

-- Row Level Security (RLS)
alter table budget_limits enable row level security;

create policy "Users can view their own budget limits"
  on budget_limits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budget limits"
  on budget_limits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budget limits"
  on budget_limits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own budget limits"
  on budget_limits for delete
  using (auth.uid() = user_id);

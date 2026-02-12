-- Create table for storing product labels
create table public.product_labels (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name text not null,
    barcode text not null,
    user_id uuid not null default auth.uid (),
    constraint product_labels_pkey primary key (id),
    constraint product_labels_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Enable RLS
alter table public.product_labels enable row level security;

-- Create policies
create policy "Users can view their own labels" on public.product_labels
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own labels" on public.product_labels
    for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own labels" on public.product_labels
    for delete
    using (auth.uid() = user_id);

-- Add realtime
alter publication supabase_realtime add table public.product_labels;

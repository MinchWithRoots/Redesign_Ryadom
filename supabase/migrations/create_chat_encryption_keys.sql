-- Create table to store per-user encrypted chat keys
create table if not exists public.chat_encryption_keys (
  id bigserial not null,
  chat_id bigint not null,
  user_id uuid not null,
  encrypted_key text not null,
  created_at timestamp with time zone null default timezone('utc'::text, now()),
  constraint chat_encryption_keys_pkey primary key (id),
  constraint chat_encryption_keys_chat_id_fkey foreign key (chat_id) references public.chats(id) on delete cascade,
  constraint chat_encryption_keys_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade,
  constraint chat_encryption_keys_unique_chat_user unique (chat_id, user_id)
) tablespace pg_default;

-- Create indexes for fast lookup
create index if not exists idx_chat_encryption_keys_chat_id on public.chat_encryption_keys using btree (chat_id) tablespace pg_default;
create index if not exists idx_chat_encryption_keys_user_id on public.chat_encryption_keys using btree (user_id) tablespace pg_default;

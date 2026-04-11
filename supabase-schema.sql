create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text default 'student' check (role in ('student','admin')),
  created_at timestamptz default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_mnt integer not null default 0,
  thumbnail_url text,
  category text,
  level text,
  is_published boolean default true,
  is_premium boolean default true,
  created_at timestamptz default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  video_url text not null,
  duration text,
  position integer not null default 0,
  is_preview boolean default false,
  created_at timestamptz default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  payment_status text default 'pending' check (payment_status in ('pending','paid','failed')),
  created_at timestamptz default now(),
  unique(user_id, course_id)
);

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  amount_mnt integer not null,
  provider text default 'manual',
  provider_order_id text,
  status text default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz default now()
);

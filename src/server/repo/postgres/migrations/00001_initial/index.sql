BEGIN;

DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      CREATE TYPE user_role AS ENUM ('admin');
    END IF;
  END
$$;

create table if not exists users (
  id bigint generated always as identity primary key,
  username varchar(256) not null unique,
  email varchar(256) not null unique,
  password varchar(256) not null,
  is_email_verified boolean default false,
  role user_role
);

create table if not exists sessions (
  id bigint generated always as identity primary key,
  token varchar(32) unique,
  secret varchar(64),
  expires_at varchar(40),
  created_at varchar(40),
  updated_at varchar(40),
  user_id bigint unique references users(id) on delete cascade
);

COMMIT;
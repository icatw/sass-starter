create table "users" ("id" text not null primary key, "name" text not null, "email" text not null unique, "email_verified" boolean not null, "image" text, "created_at" timestamptz default CURRENT_TIMESTAMP not null, "updated_at" timestamptz default CURRENT_TIMESTAMP not null, "role" text, "disabled" boolean);

create table "sessions" ("id" text not null primary key, "expires_at" timestamptz not null, "token" text not null unique, "created_at" timestamptz default CURRENT_TIMESTAMP not null, "updated_at" timestamptz not null, "ip_address" text, "user_agent" text, "user_id" text not null references "users" ("id") on delete cascade);

create table "accounts" ("id" text not null primary key, "account_id" text not null, "provider_id" text not null, "user_id" text not null references "users" ("id") on delete cascade, "access_token" text, "refresh_token" text, "id_token" text, "access_token_expires_at" timestamptz, "refresh_token_expires_at" timestamptz, "scope" text, "password" text, "created_at" timestamptz default CURRENT_TIMESTAMP not null, "updated_at" timestamptz not null);

create table "verifications" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expires_at" timestamptz not null, "created_at" timestamptz default CURRENT_TIMESTAMP not null, "updated_at" timestamptz default CURRENT_TIMESTAMP not null);

create table "jwks" ("id" text not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" timestamptz not null, "expiresAt" timestamptz);

create table "rate_limits" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "last_request" bigint not null);

create index "sessions_user_id_idx" on "sessions" ("user_id");

create index "accounts_user_id_idx" on "accounts" ("user_id");

create index "verifications_identifier_idx" on "verifications" ("identifier");
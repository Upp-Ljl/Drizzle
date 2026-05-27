CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"meme_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"odds_at_bet" real NOT NULL,
	"first_n_at_bet" integer NOT NULL,
	"certificate_id" text NOT NULL,
	"settled_payout" integer,
	"mirror_of_bet_id" integer,
	"cancelled_at" timestamp with time zone,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bets_certificate_id_unique" UNIQUE("certificate_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "epitaph_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"graveyard_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_weight" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flowers" (
	"id" serial PRIMARY KEY NOT NULL,
	"graveyard_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"day_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"kol_id" uuid NOT NULL,
	"follower_id" uuid NOT NULL,
	"mirror_cap" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "graveyard" (
	"id" serial PRIMARY KEY NOT NULL,
	"meme_id" integer NOT NULL,
	"epitaph" text,
	"epitaph_author_id" uuid,
	"max_n" integer NOT NULL,
	"backers_count" integer DEFAULT 0 NOT NULL,
	"flowers_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "graveyard_meme_id_unique" UNIQUE("meme_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memes" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_id" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"source_url" text,
	"source_platform" text DEFAULT 'other' NOT NULL,
	"first_seen_n" integer DEFAULT 0 NOT NULL,
	"current_n" integer DEFAULT 0 NOT NULL,
	"odds_x" real DEFAULT 2 NOT NULL,
	"status" text DEFAULT 'in_pool' NOT NULL,
	"verdict_source" text,
	"ticker_blurb" text,
	"nominated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nominations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"signal_id" integer,
	"meme_id" integer,
	"week_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"week_id" integer NOT NULL,
	"storage_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"weekly_coins" integer DEFAULT 100 NOT NULL,
	"coins_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_kol" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"candidate_title" text NOT NULL,
	"score" integer NOT NULL,
	"tier" text NOT NULL,
	"author_handle" text,
	"author_followers" integer,
	"growth_24h" real DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_number" integer NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"settles_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"editorial_notes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weeks_week_number_unique" UNIQUE("week_number")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bets" ADD CONSTRAINT "bets_meme_id_memes_id_fk" FOREIGN KEY ("meme_id") REFERENCES "public"."memes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "epitaph_votes" ADD CONSTRAINT "epitaph_votes_graveyard_id_graveyard_id_fk" FOREIGN KEY ("graveyard_id") REFERENCES "public"."graveyard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "epitaph_votes" ADD CONSTRAINT "epitaph_votes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flowers" ADD CONSTRAINT "flowers_graveyard_id_graveyard_id_fk" FOREIGN KEY ("graveyard_id") REFERENCES "public"."graveyard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flowers" ADD CONSTRAINT "flowers_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follows" ADD CONSTRAINT "follows_kol_id_profiles_id_fk" FOREIGN KEY ("kol_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_profiles_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "graveyard" ADD CONSTRAINT "graveyard_meme_id_memes_id_fk" FOREIGN KEY ("meme_id") REFERENCES "public"."memes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "graveyard" ADD CONSTRAINT "graveyard_epitaph_author_id_profiles_id_fk" FOREIGN KEY ("epitaph_author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memes" ADD CONSTRAINT "memes_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nominations" ADD CONSTRAINT "nominations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nominations" ADD CONSTRAINT "nominations_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nominations" ADD CONSTRAINT "nominations_meme_id_memes_id_fk" FOREIGN KEY ("meme_id") REFERENCES "public"."memes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nominations" ADD CONSTRAINT "nominations_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posters" ADD CONSTRAINT "posters_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posters" ADD CONSTRAINT "posters_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bets_meme_id_idx" ON "bets" USING btree ("meme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bets_user_id_idx" ON "bets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bets_cert_idx" ON "bets" USING btree ("certificate_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "epitaph_votes_grave_user_idx" ON "epitaph_votes" USING btree ("graveyard_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "flowers_grave_user_day_idx" ON "flowers" USING btree ("graveyard_id","user_id","day_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "follows_kol_follower_idx" ON "follows" USING btree ("kol_id","follower_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memes_week_id_idx" ON "memes" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memes_status_idx" ON "memes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signals_tier_idx" ON "signals" USING btree ("tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weeks_status_idx" ON "weeks" USING btree ("status");
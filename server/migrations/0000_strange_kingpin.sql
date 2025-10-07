CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"app_name" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"avg_latency" integer,
	"total_tokens" integer,
	"total_cost" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats" ADD CONSTRAINT "stats_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;
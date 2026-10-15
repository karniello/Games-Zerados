CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"thumbnail" text NOT NULL,
	"platform" text NOT NULL,
	"genre" text NOT NULL,
	"completion_condition" text NOT NULL,
	"rating" real NOT NULL,
	"difficulty" text NOT NULL,
	"hours" real NOT NULL,
	"completed_date" text NOT NULL,
	"release_year" integer,
	"developer" text,
	"publisher" text,
	"synopsis" text,
	"notes" text,
	"favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"username" text,
	"avatar" text,
	"gamer_tag" text,
	"favorite_platform" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "yearly_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"year" integer NOT NULL,
	"target_games" integer DEFAULT 12 NOT NULL,
	"target_hours" real DEFAULT 200,
	"notes" text,
	"backlog" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yearly_goals" ADD CONSTRAINT "yearly_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
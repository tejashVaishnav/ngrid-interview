CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"slug" text,
	"createdby" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "team_slug_unique" UNIQUE("slug"),
	CONSTRAINT "team_createdby_unique" UNIQUE("createdby")
);
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_createdby_user_id_fk" FOREIGN KEY ("createdby") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"slug" text,
	"createdby" text NOT NULL,
	"teamid" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_createdby_user_id_fk" FOREIGN KEY ("createdby") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_teamid_team_id_fk" FOREIGN KEY ("teamid") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "todos" RENAME COLUMN "text" TO "title";--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" DROP COLUMN "completed";
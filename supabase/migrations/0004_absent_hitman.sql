CREATE TABLE "productImages" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"image" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"description" text NOT NULL,
	"productOwner" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "productImages" ADD CONSTRAINT "productImages_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_productOwner_user_id_fk" FOREIGN KEY ("productOwner") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
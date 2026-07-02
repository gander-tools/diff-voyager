ALTER TABLE `urls` ADD `host` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `urls` ADD `query_string` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `urls` ADD `page_slug` text DEFAULT '' NOT NULL;
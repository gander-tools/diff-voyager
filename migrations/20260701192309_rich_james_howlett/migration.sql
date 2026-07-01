CREATE TABLE `runs` (
	`id` text PRIMARY KEY,
	`version` integer NOT NULL UNIQUE,
	`status` text DEFAULT 'open' NOT NULL,
	`pid` integer,
	`created_at` integer DEFAULT (unixepoch('now'))
);
--> statement-breakpoint
CREATE TABLE `url_runs` (
	`id` text PRIMARY KEY,
	`url_id` text NOT NULL,
	`run_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch('now')),
	CONSTRAINT `fk_url_runs_url_id_urls_id_fk` FOREIGN KEY (`url_id`) REFERENCES `urls`(`id`),
	CONSTRAINT `fk_url_runs_run_id_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`),
	CONSTRAINT `url_runs_url_id_run_id_unique` UNIQUE(`url_id`,`run_id`)
);
--> statement-breakpoint
CREATE TABLE `urls` (
	`id` text PRIMARY KEY,
	`url` text NOT NULL UNIQUE,
	`path` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now'))
);

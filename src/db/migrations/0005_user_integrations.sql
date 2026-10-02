CREATE TABLE `integrations` (
	`user_id` text PRIMARY KEY NOT NULL,
	`api_key_hash` text,
	`api_key_prefix` text,
	`webhook_url` text,
	`api_key_last_used_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integrations_api_key_hash_unique` ON `integrations` (`api_key_hash`);
ALTER TABLE `bookings` ADD `guest_answers` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `meeting_url` text;--> statement-breakpoint
ALTER TABLE `event_types` ADD `location_type` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `event_types` ADD `location_details` text;--> statement-breakpoint
ALTER TABLE `event_types` ADD `custom_questions` text DEFAULT '[]' NOT NULL;
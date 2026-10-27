CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`manage_hash` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`title` text NOT NULL,
	`questions` text NOT NULL,
	`letter` text NOT NULL,
	`revision` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`attempt` integer NOT NULL,
	`answers` text NOT NULL,
	`letter` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_attempt_unique` ON `submissions` (`room_id`,`attempt`);--> statement-breakpoint
CREATE INDEX `submission_room_idx` ON `submissions` (`room_id`);
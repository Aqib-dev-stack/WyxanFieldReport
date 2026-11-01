CREATE TABLE `report_images` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`position` integer NOT NULL,
	`original_uri` text NOT NULL,
	`local_path` text,
	`compressed_path` text,
	`size_bytes` integer,
	`width` integer,
	`height` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "report_images_position_range" CHECK("report_images"."position" BETWEEN 0 AND 4),
	CONSTRAINT "report_images_status_valid" CHECK("report_images"."status" IN ('pending', 'compressed', 'uploaded', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `report_images_report_id_idx` ON `report_images` (`report_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `report_images_report_position_idx` ON `report_images` (`report_id`,`position`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text,
	`last_error` text,
	`failure_kind` text,
	CONSTRAINT "reports_status_valid" CHECK("reports"."status" IN ('queued', 'waitingNet', 'compressing', 'uploading', 'committing', 'uploaded', 'failed')),
	CONSTRAINT "reports_failure_kind_valid" CHECK("reports"."failure_kind" IS NULL OR "reports"."failure_kind" IN ('retryable', 'permanent')),
	CONSTRAINT "reports_attempt_count_valid" CHECK("reports"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `reports_status_next_attempt_idx` ON `reports` (`status`,`next_attempt_at`);
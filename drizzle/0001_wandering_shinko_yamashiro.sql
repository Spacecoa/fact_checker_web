CREATE TABLE `fact_check_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`mainClaim` text NOT NULL,
	`source` varchar(255) NOT NULL,
	`newsLink` varchar(512),
	`summary` text,
	`llmAnalysis` text,
	`keywords` json,
	`isVerified` boolean DEFAULT false,
	`factCheckResults` json,
	`verificationStatus` enum('unverified','verified','partially_verified','false','no_evidence') DEFAULT 'unverified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`reportDate` timestamp,
	CONSTRAINT `fact_check_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `fact_check_reports_reportId_unique` UNIQUE(`reportId`)
);
--> statement-breakpoint
CREATE TABLE `telegram_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramUserId` int NOT NULL,
	`reportId` int NOT NULL,
	`messageId` varchar(255),
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	CONSTRAINT `telegram_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telegram_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`username` varchar(255),
	`isSubscribed` boolean DEFAULT true,
	`preferences` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegram_users_telegramId_unique` UNIQUE(`telegramId`)
);
--> statement-breakpoint
CREATE INDEX `source_idx` ON `fact_check_reports` (`source`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `fact_check_reports` (`createdAt`);--> statement-breakpoint
CREATE INDEX `verificationStatus_idx` ON `fact_check_reports` (`verificationStatus`);--> statement-breakpoint
CREATE INDEX `telegramUserId_idx` ON `telegram_notifications` (`telegramUserId`);--> statement-breakpoint
CREATE INDEX `reportId_idx` ON `telegram_notifications` (`reportId`);--> statement-breakpoint
CREATE INDEX `telegramId_idx` ON `telegram_users` (`telegramId`);
CREATE TABLE IF NOT EXISTS `interview_feedback` (
    `id` int AUTO_INCREMENT NOT NULL,
    `sessionId` int NOT NULL,
    `overallScore` float NOT NULL,
    `generalScore` float NOT NULL,
    `roleSpecificScore` float NOT NULL,
    `strengths` json NOT NULL,
    `weaknesses` json NOT NULL,
    `suggestions` json NOT NULL,
    `detailedAnalysis` json,
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT `interview_feedback_id` PRIMARY KEY(`id`),
    CONSTRAINT `interview_feedback_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `interview_questions` (
    `id` int AUTO_INCREMENT NOT NULL,
    `sessionId` int NOT NULL,
    `questionNumber` int NOT NULL,
    `questionText` text NOT NULL,
    `questionContext` text,
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT `interview_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `interview_responses` (
    `id` int AUTO_INCREMENT NOT NULL,
    `questionId` int NOT NULL,
    `sessionId` int NOT NULL,
    `audioUrl` text NOT NULL,
    `audioKey` varchar(512) NOT NULL,
    `transcription` text,
    `contentScore` float,
    `toneScore` float,
    `overallScore` float,
    `analysis` json,
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT `interview_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `interview_sessions` (
    `id` int AUTO_INCREMENT NOT NULL,
    `userId` int NOT NULL,
    `resumeUrl` text NOT NULL,
    `resumeKey` varchar(512) NOT NULL,
    `jobDescription` text NOT NULL,
    `jobRole` enum('programmer','sales','data_analyst') NOT NULL,
    `resumeParsedData` json,
    `status` enum('setup','in_progress','completed','abandoned') NOT NULL DEFAULT 'setup',
    `overallScore` float,
    `generalScore` float,
    `roleSpecificScore` float,
    `createdAt` timestamp NOT NULL DEFAULT (now()),
    `completedAt` timestamp,
    CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`)
);
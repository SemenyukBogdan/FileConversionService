-- CreateTable
CREATE TABLE `ConversionJob` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `status` ENUM('queued', 'processing', 'done', 'failed', 'expired') NOT NULL DEFAULT 'queued',
    `sourceFilename` VARCHAR(191) NOT NULL,
    `sourceStorageKey` VARCHAR(191) NOT NULL,
    `sourceMime` VARCHAR(191) NOT NULL,
    `sourceSize` INTEGER NOT NULL,
    `targetFormat` ENUM('webp', 'pdf', 'json') NOT NULL,
    `params` JSON NULL,
    `resultStorageKey` VARCHAR(191) NULL,
    `resultMime` VARCHAR(191) NULL,
    `resultSize` INTEGER NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(500) NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `ConversionJob_expiresAt_idx`(`expiresAt`),
    INDEX `ConversionJob_status_idx`(`status`),
    INDEX `ConversionJob_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

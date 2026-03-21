ALTER TABLE `ConversionJob`
ADD COLUMN `userId` VARCHAR(191) NULL;

CREATE INDEX `ConversionJob_userId_idx` ON `ConversionJob`(`userId`);

ALTER TABLE `ConversionJob`
ADD CONSTRAINT `ConversionJob_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `order` MODIFY `amount` INTEGER NULL,
    MODIFY `currency` VARCHAR(191) NULL,
    MODIFY `status` VARCHAR(191) NULL,
    MODIFY `stripePaymentId` VARCHAR(191) NULL;

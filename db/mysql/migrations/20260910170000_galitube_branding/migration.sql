-- AlterTable
ALTER TABLE `guilds` MODIFY `footer` VARCHAR(191) NULL DEFAULT 'Galitube Tickets by Galitube Hosting';

UPDATE `guilds` SET footer = 'Galitube Tickets by Galitube Hosting' WHERE footer IN ('Discord Tickets by eartharoid', 'Discord Tickets', 'Earthdroid', 'Planet Earth');

-- AlterTable
ALTER TABLE "guilds" ALTER COLUMN "footer" SET DEFAULT 'Galitube Tickets by Galitube Hosting';

UPDATE "guilds" SET footer = 'Galitube Tickets by Galitube Hosting' WHERE footer IN ('Discord Tickets by eartharoid', 'Discord Tickets', 'Earthdroid', 'Planet Earth');

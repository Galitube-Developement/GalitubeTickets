-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guilds" (
    "autoClose" INTEGER NOT NULL DEFAULT 43200000,
    "autoTag" TEXT NOT NULL DEFAULT '[]',
    "archive" BOOLEAN NOT NULL DEFAULT true,
    "blocklist" TEXT NOT NULL DEFAULT '[]',
    "claimButton" BOOLEAN NOT NULL DEFAULT false,
    "closeButton" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorColour" TEXT NOT NULL DEFAULT 'Red',
    "footer" TEXT DEFAULT 'Galitube Tickets by Galitube Hosting',
    "id" TEXT NOT NULL PRIMARY KEY,
    "locale" TEXT NOT NULL DEFAULT 'en-GB',
    "logChannel" TEXT,
    "primaryColour" TEXT NOT NULL DEFAULT '#009999',
    "staleAfter" INTEGER,
    "successColour" TEXT NOT NULL DEFAULT 'Green',
    "workingHours" TEXT NOT NULL DEFAULT '["UTC", ["00:00","23:59"], ["00:00","23:59"], ["00:00","23:59"], ["00:00","23:59"], ["00:00","23:59"], ["00:00","23:59"], ["00:00","23:59"]]'
);
INSERT INTO "new_guilds" ("archive", "autoClose", "autoTag", "blocklist", "claimButton", "closeButton", "createdAt", "errorColour", "footer", "id", "locale", "logChannel", "primaryColour", "staleAfter", "successColour", "workingHours") SELECT "archive", "autoClose", "autoTag", "blocklist", "claimButton", "closeButton", "createdAt", "errorColour", "footer", "id", "locale", "logChannel", "primaryColour", "staleAfter", "successColour", "workingHours" FROM "guilds";
DROP TABLE "guilds";
ALTER TABLE "new_guilds" RENAME TO "guilds";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

UPDATE "guilds" SET footer = 'Galitube Tickets by Galitube Hosting' WHERE footer IN ('Discord Tickets by eartharoid', 'Discord Tickets', 'Earthdroid', 'Planet Earth');

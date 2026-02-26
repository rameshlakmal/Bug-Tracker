-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CountEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "sprintId" INTEGER NOT NULL,
    "developerId" INTEGER NOT NULL,
    "featureKey" TEXT NOT NULL DEFAULT '',
    "metricType" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CountEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CountEntry_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CountEntry_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CountEntry" ("count", "createdAt", "developerId", "id", "metricKey", "metricType", "notes", "projectId", "sprintId", "updatedAt") SELECT "count", "createdAt", "developerId", "id", "metricKey", "metricType", "notes", "projectId", "sprintId", "updatedAt" FROM "CountEntry";
DROP TABLE "CountEntry";
ALTER TABLE "new_CountEntry" RENAME TO "CountEntry";
CREATE INDEX "CountEntry_projectId_sprintId_featureKey_idx" ON "CountEntry"("projectId", "sprintId", "featureKey");
CREATE INDEX "CountEntry_developerId_sprintId_featureKey_idx" ON "CountEntry"("developerId", "sprintId", "featureKey");
CREATE UNIQUE INDEX "CountEntry_projectId_sprintId_developerId_featureKey_metricType_metricKey_key" ON "CountEntry"("projectId", "sprintId", "developerId", "featureKey", "metricType", "metricKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

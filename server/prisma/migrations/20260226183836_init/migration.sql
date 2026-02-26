-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('PRIORITY', 'SEVERITY', 'STATUS', 'OTHER');

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDeveloper" (
    "projectId" INTEGER NOT NULL,
    "developerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDeveloper_pkey" PRIMARY KEY ("projectId","developerId")
);

-- CreateTable
CREATE TABLE "Developer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Developer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountEntry" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "sprintId" INTEGER NOT NULL,
    "developerId" INTEGER NOT NULL,
    "featureKey" TEXT NOT NULL DEFAULT '',
    "metricType" "MetricType" NOT NULL,
    "metricKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Sprint_projectId_idx" ON "Sprint"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Sprint_projectId_label_key" ON "Sprint"("projectId", "label");

-- CreateIndex
CREATE INDEX "ProjectDeveloper_developerId_idx" ON "ProjectDeveloper"("developerId");

-- CreateIndex
CREATE UNIQUE INDEX "Developer_name_key" ON "Developer"("name");

-- CreateIndex
CREATE INDEX "CountEntry_projectId_sprintId_featureKey_idx" ON "CountEntry"("projectId", "sprintId", "featureKey");

-- CreateIndex
CREATE INDEX "CountEntry_developerId_sprintId_featureKey_idx" ON "CountEntry"("developerId", "sprintId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "CountEntry_projectId_sprintId_developerId_featureKey_metric_key" ON "CountEntry"("projectId", "sprintId", "developerId", "featureKey", "metricType", "metricKey");

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeveloper" ADD CONSTRAINT "ProjectDeveloper_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeveloper" ADD CONSTRAINT "ProjectDeveloper_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountEntry" ADD CONSTRAINT "CountEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountEntry" ADD CONSTRAINT "CountEntry_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountEntry" ADD CONSTRAINT "CountEntry_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { z } from "zod";

export const createDeveloperSchema = z.object({
  name: z.string().min(1).max(120),
  team: z.string().min(1).max(120).optional(),
});

export const updateDeveloperSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  team: z.string().min(1).max(120).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createPeriodSchema = z.object({
  label: z.string().min(1).max(80),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

export const createSprintSchema = z.object({
  projectId: z.number().int().positive(),
  label: z.string().min(1).max(80),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateSprintSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const assignDeveloperToProjectSchema = z.object({
  projectId: z.number().int().positive(),
  developerId: z.number().int().positive(),
});

export const bulkUpsertEntriesSchema = z.object({
  projectId: z.number().int().positive(),
  sprintId: z.number().int().positive(),
  featureKey: z.string().max(120).optional(),
  entries: z
    .array(
      z.object({
        developerId: z.number().int().positive(),
        metricType: z.enum(["PRIORITY", "SEVERITY", "STATUS", "OTHER"]),
        metricKey: z.string().min(1).max(80),
        count: z.number().int().min(0),
      })
    )
    .min(1),
});

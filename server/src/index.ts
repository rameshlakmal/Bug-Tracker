import 'dotenv/config';
import cors from "cors";
import express from "express";
import { prisma } from "./db";
import {
  PRIORITY_KEYS,
  SEVERITY_KEYS,
  STATUS_KEYS,
  parseIntParam,
} from "./constants";
import {
  bulkUpsertEntriesSchema,
  assignDeveloperToProjectSchema,
  createDeveloperSchema,
  createProjectSchema,
  createSprintSchema,
  updateDeveloperSchema,
  updateProjectSchema,
  updateSprintSchema,
} from "./schemas";

const app = express();

const PORT = Number.parseInt(process.env.PORT || "3001", 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/developers", async (_req, res) => {
  const devs = await prisma.developer.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  res.json(devs);
});

app.post("/api/developers", async (req, res) => {
  const parsed = createDeveloperSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const created = await prisma.developer.create({ data: parsed.data });
    return res.status(201).json(created);
  } catch (e: any) {
    return res.status(409).json({ error: "Developer already exists" });
  }
});

app.delete("/api/developers/:id", async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  try {
    await prisma.developer.delete({ where: { id } });
    return res.json({ ok: true });
  } catch {
    return res.status(404).json({ error: "Developer not found" });
  }
});

app.patch("/api/developers/:id", async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateDeveloperSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await prisma.developer.update({
      where: { id },
      data: {
        ...parsed.data,
        team: parsed.data.team === null ? null : parsed.data.team,
      },
    });
    return res.json(updated);
  } catch {
    return res.status(404).json({ error: "Developer not found" });
  }
});

app.get("/api/projects", async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const created = await prisma.project.create({
      data: {
        name: parsed.data.name,
        sprints: {
          create: [{ label: "Default" }],
        },
      },
      include: { sprints: true },
    });
    return res.status(201).json(created);
  } catch {
    return res.status(409).json({ error: "Project already exists" });
  }
});

app.patch("/api/projects/:id", async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await prisma.project.update({ where: { id }, data: parsed.data });
    return res.json(updated);
  } catch {
    return res.status(404).json({ error: "Project not found" });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  try {
    await prisma.project.delete({ where: { id } });
    return res.json({ ok: true });
  } catch {
    return res.status(404).json({ error: "Project not found" });
  }
});

app.get("/api/projects/:projectId/sprints", async (req, res) => {
  const projectId = parseIntParam(req.params.projectId);
  if (!projectId) return res.status(400).json({ error: "Invalid projectId" });

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: [{ isActive: "desc" }, { id: "asc" }],
  });
  res.json(sprints);
});

app.post("/api/projects/:projectId/sprints", async (req, res) => {
  const projectId = parseIntParam(req.params.projectId);
  if (!projectId) return res.status(400).json({ error: "Invalid projectId" });

  const parsed = createSprintSchema.safeParse({ ...req.body, projectId });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const created = await prisma.sprint.create({
      data: {
        projectId,
        label: parsed.data.label,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      },
    });
    return res.status(201).json(created);
  } catch {
    return res.status(409).json({ error: "Sprint label already exists for project" });
  }
});

app.patch("/api/sprints/:id", async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateSprintSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const updated = await prisma.sprint.update({
      where: { id },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate === null ? null : parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate === null ? null : parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      },
    });
    return res.json(updated);
  } catch {
    return res.status(404).json({ error: "Sprint not found" });
  }
});

app.delete("/api/sprints/:id", async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  try {
    await prisma.sprint.delete({ where: { id } });
    return res.json({ ok: true });
  } catch {
    return res.status(404).json({ error: "Sprint not found" });
  }
});

app.get("/api/projects/:projectId/developers", async (req, res) => {
  const projectId = parseIntParam(req.params.projectId);
  if (!projectId) return res.status(400).json({ error: "Invalid projectId" });

  const members = await prisma.projectDeveloper.findMany({
    where: { projectId },
    include: { developer: true },
    orderBy: [{ developer: { name: "asc" } }],
  });

  res.json(members.map((m) => m.developer));
});

app.post("/api/projects/:projectId/developers", async (req, res) => {
  const projectId = parseIntParam(req.params.projectId);
  if (!projectId) return res.status(400).json({ error: "Invalid projectId" });

  const parsed = assignDeveloperToProjectSchema.safeParse({
    projectId,
    developerId: req.body?.developerId,
  });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    await prisma.projectDeveloper.create({
      data: { projectId, developerId: parsed.data.developerId },
    });
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(409).json({ error: "Developer already assigned" });
  }
});

app.delete("/api/projects/:projectId/developers/:developerId", async (req, res) => {
  const projectId = parseIntParam(req.params.projectId);
  const developerId = parseIntParam(req.params.developerId);
  if (!projectId || !developerId) return res.status(400).json({ error: "Invalid ids" });

  try {
    await prisma.projectDeveloper.delete({
      where: { projectId_developerId: { projectId, developerId } },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(404).json({ error: "Assignment not found" });
  }
});

app.post("/api/entries/bulk", async (req, res) => {
  const parsed = bulkUpsertEntriesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { projectId, sprintId, entries } = parsed.data;
  const featureKey = (parsed.data.featureKey ?? "").trim();

  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint || sprint.projectId !== projectId) {
    return res.status(400).json({ error: "Sprint does not belong to project" });
  }

  const assigned = await prisma.projectDeveloper.findMany({
    where: { projectId },
    select: { developerId: true },
  });
  const assignedSet = new Set(assigned.map((a) => a.developerId));
  const filtered = entries.filter((e) => assignedSet.has(e.developerId));
  if (!filtered.length) {
    return res.status(400).json({ error: "No entries for project-assigned developers" });
  }

  await prisma.$transaction(
    filtered.map((e) =>
      prisma.countEntry.upsert({
        where: {
          projectId_sprintId_developerId_featureKey_metricType_metricKey: {
            projectId,
            sprintId,
            developerId: e.developerId,
            featureKey,
            metricType: e.metricType,
            metricKey: e.metricKey,
          },
        },
        update: { count: e.count },
        create: {
          projectId,
          sprintId,
          developerId: e.developerId,
          featureKey,
          metricType: e.metricType,
          metricKey: e.metricKey,
          count: e.count,
        },
      })
    )
  );

  res.json({ ok: true });
});

function sumValues(obj: Record<string, number>, keys: readonly string[]) {
  return keys.reduce((acc, k) => acc + (obj[k] || 0), 0);
}

app.get("/api/reports/summary", async (req, res) => {
  const projectId = parseIntParam(req.query.projectId);
  const sprintId = parseIntParam(req.query.sprintId);
  const featureKeyRaw = typeof req.query.featureKey === "string" ? req.query.featureKey : undefined;
  const featureKey = featureKeyRaw !== undefined ? featureKeyRaw.trim() : undefined;
  if (!projectId || !sprintId) {
    return res.status(400).json({ error: "projectId and sprintId are required" });
  }

  const [project, sprint, members, entries] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.sprint.findUnique({ where: { id: sprintId } }),
    prisma.projectDeveloper.findMany({
      where: { projectId },
      include: { developer: true },
      orderBy: [{ developer: { name: "asc" } }],
    }),
    prisma.countEntry.findMany({
      where: {
        projectId,
        sprintId,
        ...(featureKey !== undefined ? { featureKey } : {}),
      },
    }),
  ]);

  if (!project) return res.status(404).json({ error: "Project not found" });
  if (!sprint || sprint.projectId !== projectId) return res.status(404).json({ error: "Sprint not found" });

  const developers = members.map((m) => m.developer).filter((d) => d.isActive);

  const byDev: Record<number, any> = {};
  for (const d of developers) {
    byDev[d.id] = {
      developerId: d.id,
      name: d.name,
      priority: Object.fromEntries(PRIORITY_KEYS.map((k) => [k, 0])),
      severity: Object.fromEntries(SEVERITY_KEYS.map((k) => [k, 0])),
      status: Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])),
      suggestions: 0,
    };
  }

  for (const e of entries) {
    const row = byDev[e.developerId];
    if (!row) continue;
    if (e.metricType === "PRIORITY") row.priority[e.metricKey] = e.count;
    else if (e.metricType === "SEVERITY") row.severity[e.metricKey] = e.count;
    else if (e.metricType === "STATUS") row.status[e.metricKey] = e.count;
    else if (e.metricType === "OTHER" && e.metricKey === "SUGGESTIONS") row.suggestions = e.count;
  }

  const developerRows = developers.map((d) => {
    const row = byDev[d.id];
    const priorityTotal = sumValues(row.priority, PRIORITY_KEYS);
    const severityTotal = sumValues(row.severity, SEVERITY_KEYS);
    const statusTotal = sumValues(row.status, STATUS_KEYS);
    return {
      ...row,
      totals: {
        priority: priorityTotal,
        severity: severityTotal,
        status: statusTotal,
      },
    };
  });

  const totals = {
    priority: Object.fromEntries(PRIORITY_KEYS.map((k) => [k, 0])) as Record<string, number>,
    severity: Object.fromEntries(SEVERITY_KEYS.map((k) => [k, 0])) as Record<string, number>,
    status: Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])) as Record<string, number>,
    suggestions: 0,
  };

  for (const row of developerRows) {
    for (const k of PRIORITY_KEYS) totals.priority[k] += row.priority[k] || 0;
    for (const k of SEVERITY_KEYS) totals.severity[k] += row.severity[k] || 0;
    for (const k of STATUS_KEYS) totals.status[k] += row.status[k] || 0;
    totals.suggestions += row.suggestions || 0;
  }

  const sprintTotal = sumValues(totals.priority, PRIORITY_KEYS);

  res.json({
    project,
    sprint,
    rows: developerRows,
    totals: {
      priority: { ...totals.priority, Total: sprintTotal },
      severity: { ...totals.severity, Total: sumValues(totals.severity, SEVERITY_KEYS) },
      status: { ...totals.status, Total: sumValues(totals.status, STATUS_KEYS) },
      suggestions: totals.suggestions,
    },
    sprintTotal,
    note:
      featureKey !== undefined && featureKey !== ""
        ? `Filtered to feature: ${featureKey}. Sprint total is computed as sum of all PRIORITY counts.`
        : featureKey === ""
          ? "Filtered to unassigned feature. Sprint total is computed as sum of all PRIORITY counts."
          : "Sprint total is computed as sum of all PRIORITY counts.",
  });
});

app.get("/api/reports/feature-keys", async (req, res) => {
  const projectId = parseIntParam(req.query.projectId);
  const sprintId = parseIntParam(req.query.sprintId);
  if (!projectId || !sprintId) {
    return res.status(400).json({ error: "projectId and sprintId are required" });
  }

  const entries = await prisma.countEntry.findMany({
    where: { projectId, sprintId },
    select: { featureKey: true },
  });

  const set = new Set(entries.map((e) => e.featureKey.trim()).filter((k) => k.length > 0));
  res.json(Array.from(set).sort((a, b) => a.localeCompare(b)));
});

app.get("/api/reports/by-feature", async (req, res) => {
  const projectId = parseIntParam(req.query.projectId);
  const sprintId = parseIntParam(req.query.sprintId);
  if (!projectId || !sprintId) {
    return res.status(400).json({ error: "projectId and sprintId are required" });
  }

  const entries = await prisma.countEntry.findMany({ where: { projectId, sprintId } });

  const blank = "";
  const byFeature: Record<string, any> = {};

  function ensure(featureKey: string) {
    if (!byFeature[featureKey]) {
      byFeature[featureKey] = {
        featureKey,
        priority: Object.fromEntries(PRIORITY_KEYS.map((k) => [k, 0])),
        severity: Object.fromEntries(SEVERITY_KEYS.map((k) => [k, 0])),
        status: Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])),
        suggestions: 0,
      };
    }
    return byFeature[featureKey];
  }

  for (const e of entries) {
    const fk = (e.featureKey || blank).trim();
    const row = ensure(fk);
    if (e.metricType === "PRIORITY") row.priority[e.metricKey] = (row.priority[e.metricKey] || 0) + e.count;
    else if (e.metricType === "SEVERITY") row.severity[e.metricKey] = (row.severity[e.metricKey] || 0) + e.count;
    else if (e.metricType === "STATUS") row.status[e.metricKey] = (row.status[e.metricKey] || 0) + e.count;
    else if (e.metricType === "OTHER" && e.metricKey === "SUGGESTIONS") row.suggestions += e.count;
  }

  const rows = Object.values(byFeature).map((r: any) => {
    const priorityTotal = sumValues(r.priority, PRIORITY_KEYS);
    const severityTotal = sumValues(r.severity, SEVERITY_KEYS);
    const statusTotal = sumValues(r.status, STATUS_KEYS);
    return {
      ...r,
      totals: {
        priority: priorityTotal,
        severity: severityTotal,
        status: statusTotal,
      },
      sprintTotal: priorityTotal,
    };
  });

  rows.sort((a: any, b: any) => {
    if (a.featureKey === "" && b.featureKey !== "") return -1;
    if (a.featureKey !== "" && b.featureKey === "") return 1;
    return a.featureKey.localeCompare(b.featureKey);
  });

  res.json(rows);
});

app.get("/api/reports/trends", async (_req, res) => {
  const projectId = parseIntParam(_req.query.projectId);
  if (!projectId) return res.status(400).json({ error: "projectId is required" });

  const sprints = await prisma.sprint.findMany({ where: { projectId }, orderBy: { id: "asc" } });
  const entries = await prisma.countEntry.findMany({ where: { projectId } });

  const bySprint: Record<number, any> = {};
  for (const s of sprints) {
    bySprint[s.id] = {
      sprintId: s.id,
      label: s.label,
      priorityTotal: 0,
      severityTotal: 0,
      statusTotal: 0,
      suggestionsTotal: 0,
    };
  }

  for (const e of entries) {
    const row = bySprint[e.sprintId];
    if (!row) continue;
    if (e.metricType === "PRIORITY") row.priorityTotal += e.count;
    else if (e.metricType === "SEVERITY") row.severityTotal += e.count;
    else if (e.metricType === "STATUS") row.statusTotal += e.count;
    else if (e.metricType === "OTHER" && e.metricKey === "SUGGESTIONS") row.suggestionsTotal += e.count;
  }

  res.json(sprints.map((s) => bySprint[s.id]));
});

app.get("/api/reports/history", async (req, res) => {
  const projectId = parseIntParam(req.query.projectId);
  const developerId = parseIntParam(req.query.developerId);
  if (!projectId || !developerId) {
    return res.status(400).json({ error: "projectId and developerId are required" });
  }

  const sprints = await prisma.sprint.findMany({ where: { projectId }, orderBy: { id: "asc" } });
  const entries = await prisma.countEntry.findMany({ where: { projectId, developerId } });

  const bySprint: Record<number, any> = {};
  for (const s of sprints) {
    bySprint[s.id] = {
      sprintId: s.id,
      label: s.label,
      priorityTotal: 0,
      severityTotal: 0,
      statusTotal: 0,
      suggestions: 0,
    };
  }

  for (const e of entries) {
    const row = bySprint[e.sprintId];
    if (!row) continue;
    if (e.metricType === "PRIORITY") row.priorityTotal += e.count;
    else if (e.metricType === "SEVERITY") row.severityTotal += e.count;
    else if (e.metricType === "STATUS") row.statusTotal += e.count;
    else if (e.metricType === "OTHER" && e.metricKey === "SUGGESTIONS") row.suggestions = e.count;
  }

  res.json(sprints.map((s) => bySprint[s.id]));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});

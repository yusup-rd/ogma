const { z } = require("zod");
const analysisResultSchema = z.object({
  id: z.string(),
  draftRevision: z.number().int().positive(),
  fingerprint: z.string(),
  format: z.enum(["pdf", "docx"]),
  rubricVersion: z.literal(1),
  createdAt: z.string(),
  status: z.enum(["complete", "incomplete"]),
  score: z.number().min(0).max(100).nullable(),
  checks: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      label: z.string(),
      status: z.enum(["passed", "failed", "skipped", "advisory"]),
      points: z.number(),
      earned: z.number(),
      field: z.string().optional(),
      fix: z.string(),
      severity: z.enum(["error", "warning", "info"]),
    }),
  ),
});
module.exports = { analysisResultSchema };

const { z } = require("zod");
const { resumeDocumentSchema } = require("./resume-workspace.cjs");
const importReviewSchema = z.object({
  text: z.string().max(200000),
  pageCount: z.number().int().positive().nullable(),
  warnings: z.array(z.string()),
  requiresManualEntry: z.boolean(),
  links: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
      page: z.number().int().positive(),
    }),
  ),
  document: resumeDocumentSchema,
  unmapped: z.string(),
});
module.exports = { importReviewSchema };

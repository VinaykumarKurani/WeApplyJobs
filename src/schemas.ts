import { z } from "zod";

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  candidateId: z.string().min(1, "Candidate ID is required"),
  recruiterId: z.string().min(1, "Recruiter ID is required"),
  coverLetter: z.string().min(1, "Cover letter is required"),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

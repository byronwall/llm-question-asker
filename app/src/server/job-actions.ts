import { action, query } from "@solidjs/router";

import { jobsDb } from "./jobs-db";

export const getJob = query(async (jobId: string) => {
  "use server";
  console.log("job-actions:getJob", { jobId });
  const db = jobsDb();
  return db.getJob(jobId);
}, "job:get");

export const getActiveJobs = query(async () => {
  "use server";
  console.log("job-actions:getActiveJobs");
  const db = jobsDb();
  return db.listActiveJobs();
}, "job:active");

export const getAllJobs = query(async () => {
  "use server";
  console.log("job-actions:getAllJobs");
  const db = jobsDb();
  return db.listAllJobs();
}, "job:all");

export const cancelJob = action(async (jobId: string) => {
  "use server";
  console.log("job-actions:cancelJob", { jobId });
  const db = jobsDb();
  const job = await db.getJob(jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  if (job.stage !== "pending") {
    throw new Error("Can only cancel pending jobs");
  }
  return db.failJob(jobId, "Cancelled by user");
}, "job:cancel");

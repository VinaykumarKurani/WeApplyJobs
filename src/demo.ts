async function fireApplications(count: number) {
  const requests = Array.from({ length: count }, (_, i) =>
    fetch("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: `job-${i}`,
        candidateId: `candidate-${i}`,
        recruiterId: `recruiter-${i % 3}`, // simulate a few recruiters, not 20 unique ones
        coverLetter: `Cover letter for application ${i}`,
      }),
    }),
  );

  const start = Date.now();
  const responses = await Promise.all(requests);
  const elapsed = Date.now() - start;

  const failed = responses.filter((r) => !r.ok).length;
  console.log(`Fired ${count} requests in ${elapsed}ms — ${failed} failed`);
}

async function pollHealth(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    const res = await fetch("http://localhost:3000/health");
    const data = await res.json();

    console.log(
      `[t+${i}s] status=${data.status} ` +
        `notifications(w:${data.queues.notifications.waiting} a:${data.queues.notifications.active} f:${data.queues.notifications.failed}) ` +
        `stats-updates(w:${data.queues["stats-updates"].waiting} a:${data.queues["stats-updates"].active} f:${data.queues["stats-updates"].failed}) ` +
        `audit-logs(w:${data.queues["audit-logs"].waiting} a:${data.queues["audit-logs"].active} f:${data.queues["audit-logs"].failed})`,
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function main() {
  await fireApplications(20);
  await pollHealth(10);
}

main();

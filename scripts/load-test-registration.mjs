/**
 * EduPath registration load test.
 *
 * IMPORTANT: run this ONLY against a staging/test deployment or with a
 * dedicated test email domain. It creates real registration records.
 *
 * Windows Git Bash:
 *   LOAD_TEST_BASE_URL=https://your-staging.vercel.app LOAD_TEST_COUNT=500 node scripts/load-test-registration.mjs
 */

const baseUrl = (process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const count = Math.max(1, Number(process.env.LOAD_TEST_COUNT || 100));
const concurrency = Math.max(1, Number(process.env.LOAD_TEST_CONCURRENCY || 50));
const stamp = Date.now();

let next = 0;
let success = 0;
let failed = 0;
const failures = [];

async function worker() {
  while (true) {
    const index = next++;
    if (index >= count) return;

    const email = `loadtest.${stamp}.${index}@example.invalid`;
    const payload = {
      name: `EduPath Load Test ${index}`,
      email,
      mobile: `91990000${String(index).padStart(4, '0')}`,
      password: 'LoadTest@12345',
      educationLevel: '10th / School Student',
      stream: 'Not Selected',
      state: 'Karnataka',
      city: 'Bengaluru',
      interestedCourse: 'Career Guidance',
      careerGoal: 'Software Development Engineer',
      preferredDate: new Date().toISOString().slice(0, 10),
      preferredTimeSlot: `LOAD-${index}`,
    };

    try {
      const response = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': `load-${stamp}-${index}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        success += 1;
      } else {
        failed += 1;
        failures.push({ index, status: response.status, body: await response.text() });
      }
    } catch (error) {
      failed += 1;
      failures.push({ index, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

const started = Date.now();
await Promise.all(Array.from({ length: Math.min(concurrency, count) }, () => worker()));

console.log(JSON.stringify({
  baseUrl,
  count,
  concurrency,
  success,
  failed,
  durationMs: Date.now() - started,
  failures: failures.slice(0, 20),
}, null, 2));

process.exitCode = failed > 0 ? 1 : 0;

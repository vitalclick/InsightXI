// Postgres smoke test — exercises the DATA_BACKEND=postgres path end to end
// over HTTP against a running API (CI starts it against a Postgres service).
// Uses only the built-in fetch (no driver import), so it runs from the repo
// root without workspace dependency resolution.
//
// Verifies, in order:
//   1. API health
//   2. Login as the seeded PREMIUM demo user      (postgres user-store read)
//   3. Trigger ingestion                          (postgres football-repo writes + reload)
//   4. Leagues are served                         (postgres football-repo reads)
//   5. Register a new user                        (postgres user-store insert)
//   6. Welcome notification is present            (postgres notification-store write + read)
//   7. Mark all read → unread count is 0          (postgres notification update)
//   8. Export account                             (read aggregation)
//   9. Delete account                             (postgres delete of dependents + user)
//  10. Deleted user can no longer sign in         (confirms the row is gone)

const BASE = process.env.SMOKE_API_URL ?? "http://localhost:4000";

let passed = 0;
function check(label, ok) {
  if (!ok) {
    console.error(`✗ ${label}`);
    process.exit(1);
  }
  passed++;
  console.log(`✓ ${label}`);
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

async function waitForHealth(attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`API never became healthy at ${BASE}/health`);
}

async function main() {
  await waitForHealth();
  check("API is healthy", true);

  // 2. Seeded PREMIUM demo user (inserted into Postgres on boot).
  const login = await req("POST", "/auth/login", {
    body: { email: "premium@insightxi.dev", password: "password" },
  });
  check("premium demo login succeeds", login.status === 200 && login.json?.accessToken);
  const adminToken = login.json.accessToken;

  // 3. Ingest seed data into Postgres (premium-guarded).
  const ingest = await req("POST", "/ingestion/run", { token: adminToken });
  check("ingestion run succeeds", ingest.status === 200 || ingest.status === 201);

  // 4. Leagues served from Postgres.
  const leagues = await req("GET", "/leagues");
  check(
    "leagues are served from Postgres after ingestion",
    leagues.status === 200 && Array.isArray(leagues.json) && leagues.json.length > 0,
  );

  // 5. Register a fresh user (Postgres insert).
  const email = `smoke_${Date.now()}@example.com`;
  const reg = await req("POST", "/auth/register", {
    body: { email, password: "secret123" },
  });
  check("register inserts a new user", reg.status === 200 || reg.status === 201);
  const token = reg.json.accessToken;
  const userId = reg.json.user?.id;
  check("registered user is unverified by default", reg.json.user?.emailVerified === false);

  // 6. Welcome notification persisted + readable.
  const notes = await req("GET", "/notifications", { token });
  check(
    "welcome notification was persisted",
    notes.status === 200 && Array.isArray(notes.json) && notes.json.some((n) => n.type === "welcome"),
  );

  // 7. Mark all read → unread count 0.
  await req("POST", "/notifications/read-all", { token });
  const unread = await req("GET", "/notifications/unread-count", { token });
  check("unread count is 0 after read-all", unread.status === 200 && unread.json?.count === 0);

  // 8. Export account data.
  const exp = await req("GET", "/auth/account/export", { token });
  check(
    "account export returns the user's data",
    exp.status === 200 && exp.json?.account?.email === email.toLowerCase(),
  );

  // 9. Delete the account (dependents first, then user).
  const del = await req("DELETE", "/auth/account", { token });
  check("account deletion succeeds", del.status === 200 && del.json?.deleted === true);

  // 10. Deleted user cannot sign in (row is gone from Postgres).
  const relogin = await req("POST", "/auth/login", {
    body: { email, password: "secret123" },
  });
  check("deleted user can no longer sign in", relogin.status === 401);

  console.log(`\nPostgres smoke test passed (${passed} checks). userId=${userId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

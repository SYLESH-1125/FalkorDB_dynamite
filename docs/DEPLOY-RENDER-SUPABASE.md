# Render + Supabase (required for BHUMI free deploy)

## Why deploy fails with `Network is unreachable`

Supabase **direct** connections use host:

`db.<project-ref>.supabase.co`

That host is often **IPv6-only**. **Render cannot reach it** → `OSError: [Errno 101] Network is unreachable`.

**Fix:** use **Connection pooling → Session mode** (not Direct).

---

## Correct `DATABASE_URL` on Render

1. Supabase project **falkor** → **Connect** (top).
2. **Connection pooling** (or **Pooler** tab).
3. **Session mode** · port **5432**.
4. Copy the URI. It looks like:

```text
postgresql://postgres.zixdhmtwaogydtofcisg:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

(Region `ap-south-1` may differ — use **your** pooler host from the dashboard.)

5. Render → **Environment** → `DATABASE_URL`:

```text
postgresql+asyncpg://postgres.zixdhmtwaogydtofcisg:[PASSWORD]@aws-0-XXXX.pooler.supabase.com:5432/postgres
```

- Replace `postgresql://` with `postgresql+asyncpg://`.
- If password contains `#`, encode as `%23`.
- Keep `DATABASE_SSL=true`.

**Wrong (will fail on Render):**

```text
...@db.zixdhmtwaogydtofcisg.supabase.co:5432/...
```

---

## Transaction pooler (port 6543) only

If you must use port **6543**, set on Render:

- `DATABASE_PGBOUNCER=true`

Session mode on **5432** is preferred (migrations + app).

---

## After updating `DATABASE_URL`

1. **Save** environment.
2. **Manual Deploy** → latest commit.
3. Logs should show: `FalkorDB ready at 127.0.0.1:6379`
4. Open `/health` → `"graph":"falkordb"`.

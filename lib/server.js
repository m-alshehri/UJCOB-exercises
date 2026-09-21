import { createClient } from "@supabase/supabase-js";
export function publicClient(token) {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ulueevjobheawtnqgupf.supabase.co";
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_GqCv0jA3433Li4Qk6K-Wgg_3UZXJW_h";
  return createClient(url, key, {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authenticate(req) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Bearer "))
    throw Object.assign(new Error("Sign in required."), { status: 401 });
  const token = value.slice(7),
    client = publicClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user)
    throw Object.assign(new Error("Your session expired. Sign in again."), {
      status: 401,
    });
  return { client, user: data.user };
}
export async function all(makeQuery) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await makeQuery().range(from, from + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export function logRequest(req, res, route) {
  const started = Date.now(),
    send = res.json.bind(res);
  console.log(JSON.stringify({ route, event: "start" }));
  res.json = (body) => {
    console.log(
      JSON.stringify({
        route,
        event: "done",
        status: res.statusCode || 200,
        ms: Date.now() - started,
      }),
    );
    return send(body);
  };
}

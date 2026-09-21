// Local-only browser fixture. Never included in dist or enabled on Vercel.
export const writes = [];
const uid = "11111111-1111-4111-8111-111111111111",
  cid = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  qid = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
export function fixture(req, res, path) {
  if (!path.startsWith("/__fixture/")) return false;
  res.setHeader("Content-Type", "application/json");
  let value = [];
  if (path.includes("/auth/")) value = { id: uid, email: "test@example.test" };
  else if (path.endsWith("/state")) {
    res.setHeader("Content-Type", "text/html");
    res.end(
      "<pre>" +
        JSON.stringify(writes, null, 2).replaceAll("<", "&lt;") +
        "</pre>",
    );
    return true;
  } else if (path.endsWith("/courses")) {
    value = { id: cid, code: "BCIS 313", name: "Programming for Business" };
    if (!req.headers.accept?.includes("object")) value = [value];
  } else if (path.endsWith("/questions"))
    value = [
      {
        id: qid,
        question: "Which value is correct?",
        correct_answer: "Correct option",
        wrong_answers: ["Wrong one", "Wrong two", "Wrong three"],
        explanation: "Test explanation.",
        topics: { name: "Basics" },
      },
    ];
  else if (path.includes("/rpc/") || req.method === "POST") {
    let chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      writes.push({ path, body });
      if (path.endsWith("submit_practice_answer"))
        value = { is_correct: true, correct_answers: 1 };
      else if (path.endsWith("finish_practice_attempt"))
        value = { correct_answers: 1, score_percent: 100, total_questions: 1 };
      else value = { id: body.p_id };
      res.end(JSON.stringify(value));
    });
    return true;
  }
  res.end(JSON.stringify(value));
  return true;
}
export const config = `window.TAMAREEN_SUPABASE_URL=location.origin+'/__fixture';window.TAMAREEN_SUPABASE_PUBLISHABLE_KEY='test-public-key';localStorage.setItem('sb-127-auth-token',JSON.stringify({access_token:'test-token',refresh_token:'test-refresh',expires_at:4102444800,token_type:'bearer',user:{id:'${uid}',email:'test@example.test',aud:'authenticated',role:'authenticated'}}));`;

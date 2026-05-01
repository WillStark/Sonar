export function scoreLenderFit(input: { title?: string; industry?: string; recentSignal?: string; geography?: string }) {
  let fit_score = 0;
  const reasons: string[] = [];
  const t = (input.title || "").toLowerCase();
  const i = (input.industry || "").toLowerCase();
  const s = (input.recentSignal || "").toLowerCase();
  if (/(vp collections|cro|cfo|head of recovery|director of collections)/.test(t)) { fit_score += 4; reasons.push("Senior collections/finance title"); }
  if (/(consumer credit|bnpl|auto|student)/.test(i)) { fit_score += 3; reasons.push("Target lending vertical"); }
  if (/(funding|hiring|complaint)/.test(s)) { fit_score += 2; reasons.push("Recent public signal"); }
  if ((input.geography || "").toUpperCase() === "US") { fit_score += 1; reasons.push("US geography"); }
  return { fit_score: Math.min(10, fit_score), reasons };
}

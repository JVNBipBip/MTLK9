/** Nick's operating week. Always use the day in Montréal, not the server's UTC day. */
const weekday = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "America/Toronto",
});
export function trainingDay(iso: string | undefined) {
  if (
    !iso ||
    !/(Z|[+-]\d\d:\d\d)$/i.test(iso) ||
    !Number.isFinite(Date.parse(iso))
  )
    return "closed";
  const d = weekday.format(new Date(iso));
  return d === "Mon" || d === "Tue"
    ? "closed"
    : d === "Sat" || d === "Sun"
      ? "weekend"
      : "weekday";
}
export function trainerCanWork(
  iso: string,
  name?: string | null,
  id?: string | null,
  nickId?: string | null,
) {
  const day = trainingDay(iso);
  if (day !== "weekend") return day === "weekday";
  if (id && id === nickId) return false;
  return /^(mia|tyson)(?:\s|$)/i.test(name?.trim() || "");
}
export function groupSessionCanRun(
  s: {
    startsAtIso?: string;
    coachLabel?: string | null;
    coachId?: string | null;
  },
  nickId?: string | null,
) {
  const day = trainingDay(s.startsAtIso);
  if (day !== "weekend") return day === "weekday";
  if (s.coachId && s.coachId === nickId) return false;
  if (s.coachLabel?.trim())
    return !/^(nick|nicolas|nicholas)(?:\s|$)/i.test(s.coachLabel.trim());
  // Staff-published group cohorts may have no individual appointment/trainer.
  return !s.coachId || !!nickId;
}

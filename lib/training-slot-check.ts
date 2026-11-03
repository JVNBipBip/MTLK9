import { getNickTeamMemberIdForConsultation } from "./square-service-config";
import { retrieveSquareTeamMember, searchSquareAvailability } from "./square";
import { trainingDay, trainerCanWork } from "./training-week";

/** Check on submit too: a stale tab or a hand-crafted slot key must not create
 * an appointment outside the roster or Square's actual remaining availability. */
export async function trainingSlotStillAvailable(
  start: string,
  service: string,
  team: string,
) {
  const day = trainingDay(start),
    ms = Date.parse(start);
  if (day === "closed" || ms <= Date.now() || !service || !team) return false;
  if (day === "weekend") {
    const [name, nick] = await Promise.all([
      retrieveSquareTeamMember(team),
      getNickTeamMemberIdForConsultation(),
    ]);
    if (!trainerCanWork(start, name, team, nick)) return false;
  }
  const from = Math.max(Date.now(), ms - 60000);
  const res = await searchSquareAvailability({
    serviceVariationId: service,
    teamMemberId: team,
    startAt: new Date(from).toISOString(),
    endAt: new Date(from + 86400000).toISOString(),
  });
  return (res.availabilities || []).some(
    (a) =>
      Date.parse(a.start_at || "") === ms &&
      a.appointment_segments?.[0]?.team_member_id === team &&
      a.appointment_segments[0].service_variation_id === service,
  );
}

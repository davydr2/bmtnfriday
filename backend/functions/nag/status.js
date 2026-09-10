const { ddb, TABLE, GetCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

exports.handler = async (event) => {
  try {
    const cycleId = event.pathParameters?.id;
    const claims = event.requestContext?.authorizer?.claims || {};
    const employeeId = claims['custom:employee_id'] || claims.sub;

    // Determine current week number within cycle
    const now = new Date();
    const weekNum = getWeekNumber(now);

    const nagRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `CYCLE#${cycleId}`, SK: `NAG#${weekNum}` },
    }));

    const nag = nagRes.Item;
    if (!nag || !nag.available_at || new Date(nag.available_at) > now) {
      return ok({ available: false });
    }

    if (nag.claimed_by) {
      return ok({
        available: false,
        claimed: true,
        claimed_by_me: nag.claimed_by === employeeId,
      });
    }

    return ok({ available: true, week: weekNum });
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to check nag status');
  }
};

function getWeekNumber(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

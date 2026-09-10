const { ddb, TABLE, QueryCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

function weeklyPool(eligible, submitted, completedBy7pm = false, completedBy8pm = false) {
  if (eligible <= 0 || submitted / eligible < 0.50) return 0;
  const base = completedBy7pm ? 35 : completedBy8pm ? 30 : 25;
  return Math.round(base * (submitted / eligible) * 100) / 100;
}

async function getCyclePool(cycleId) {
  const weeksRes = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `CYCLE#${cycleId}`, ':sk': 'WEEK#' },
  }));
  return (weeksRes.Items || []).reduce((sum, w) => sum + (w.pool_amount || 0), 0);
}

async function getCycleSubmissionCount(cycleId) {
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': `CYCLE#${cycleId}#SUBMISSIONS` },
    Select: 'COUNT',
  }));
  return res.Count || 0;
}

exports.handler = async () => {
  try {
    // Load all cycles, sorted by start date descending
    const allCycles = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      ExpressionAttributeValues: { ':type': 'CYCLE' },
      ScanIndexForward: false,
    }));

    const cycles = allCycles.Items || [];
    const activeCycle = cycles.find(c => c.status === 'active');
    const closedCycles = cycles.filter(c => c.status === 'closed');
    const prevCycle = closedCycles[0] || null;

    // Previous cycle stats
    let previous_cycle = null;
    if (prevCycle) {
      const [prevSubmitted, prevPool] = await Promise.all([
        getCycleSubmissionCount(prevCycle.id),
        getCyclePool(prevCycle.id),
      ]);
      const prevParticipation = prevCycle.eligible_count > 0
        ? Math.round(prevSubmitted / prevCycle.eligible_count * 1000) / 10
        : 0;
      previous_cycle = {
        id: prevCycle.id,
        name: prevCycle.name,
        starts_at: prevCycle.starts_at,
        ends_at: prevCycle.ends_at,
        eligible: prevCycle.eligible_count,
        submitted: prevSubmitted,
        participation_percent: prevParticipation,
        total_pool: Math.round(prevPool * 100) / 100,
        winner_name: prevCycle.winner_name || null,
      };
    }

    if (!activeCycle) {
      return ok({ active: false, previous_cycle });
    }

    const submitted = await getCycleSubmissionCount(activeCycle.id);
    const eligible = activeCycle.eligible_count;
    const participation = eligible > 0 ? submitted / eligible : 0;
    const totalPool = await getCyclePool(activeCycle.id);

    // Next Friday 9 PM ET deadline (UTC+1:30 Sat = 02:30 UTC in EST, 01:30 in EDT)
    const now = new Date();
    const deadlineUTC = new Date(now);
    deadlineUTC.setUTCHours(2, 0, 0, 0);
    const day = deadlineUTC.getUTCDay();
    if (day !== 6) {
      deadlineUTC.setUTCDate(deadlineUTC.getUTCDate() + ((6 - day + 7) % 7));
    }

    return ok({
      active: true,
      cycle: {
        id: activeCycle.id,
        name: activeCycle.name,
        starts_at: activeCycle.starts_at,
        ends_at: activeCycle.ends_at,
      },
      eligible,
      submitted,
      participation_percent: Math.round(participation * 1000) / 10,
      current_weekly_pool: weeklyPool(eligible, submitted),
      total_pool: Math.round(totalPool * 100) / 100,
      deadline_utc: deadlineUTC.toISOString(),
      previous_cycle,
    });
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to load portal status');
  }
};

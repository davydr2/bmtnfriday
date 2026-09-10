const { ddb, TABLE, QueryCommand, GetCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

function weeklyPool(eligible, submitted, completedBy7pm = false, completedBy8pm = false) {
  if (eligible <= 0 || submitted / eligible < 0.50) return 0;
  const base = completedBy7pm ? 35 : completedBy8pm ? 30 : 25;
  return Math.round(base * (submitted / eligible) * 100) / 100;
}

exports.handler = async () => {
  try {
    // Find the active cycle
    const cyclesRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':type': 'CYCLE', ':active': 'active' },
    }));

    if (!cyclesRes.Items?.length) {
      return ok({ active: false });
    }

    const cycle = cyclesRes.Items[0];

    // Count submissions
    const subsRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': `CYCLE#${cycle.id}#SUBMISSIONS` },
      Select: 'COUNT',
    }));
    const submitted = subsRes.Count || 0;
    const eligible = cycle.eligible_count;
    const participation = eligible > 0 ? submitted / eligible : 0;

    // Get all weekly pool records for the cycle
    const weeksRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CYCLE#${cycle.id}`,
        ':sk': 'WEEK#',
      },
    }));
    const totalPool = (weeksRes.Items || []).reduce((sum, w) => sum + (w.pool_amount || 0), 0);

    // Deadline: 9 PM ET Friday (2 AM UTC Saturday)
    const now = new Date();
    const deadlineUTC = new Date(now);
    deadlineUTC.setUTCHours(2, 0, 0, 0);
    // Move to next Saturday if needed
    const day = deadlineUTC.getUTCDay();
    if (day !== 6) {
      deadlineUTC.setUTCDate(deadlineUTC.getUTCDate() + ((6 - day + 7) % 7));
    }

    return ok({
      active: true,
      cycle: {
        id: cycle.id,
        name: cycle.name,
        starts_at: cycle.starts_at,
        ends_at: cycle.ends_at,
      },
      eligible,
      submitted,
      participation_percent: Math.round(participation * 1000) / 10,
      current_weekly_pool: weeklyPool(eligible, submitted),
      total_pool: Math.round(totalPool * 100) / 100,
      deadline_utc: deadlineUTC.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to load portal status');
  }
};

const { ddb, TABLE, QueryCommand, PutCommand, GetCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

function weeklyPool(eligible, submitted, completedBy7pm, completedBy8pm) {
  if (eligible <= 0 || submitted / eligible < 0.50) return 0;
  const base = completedBy7pm ? 35 : completedBy8pm ? 30 : 25;
  return Math.round(base * (submitted / eligible) * 100) / 100;
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

exports.handler = async () => {
  try {
    const now = new Date();

    // Find active cycle
    const cyclesRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':type': 'CYCLE', ':active': 'active' },
    }));

    if (!cyclesRes.Items?.length) return ok({ skipped: true });

    const cycle = cyclesRes.Items[0];
    const weekNum = getWeekNumber(now);

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

    // Check early-completion bonuses
    // This runs at 9 PM ET (2 AM UTC) — check if 100% submitted by 7 or 8 PM ET
    const completedBy7pm = submitted >= eligible; // if all submitted by now, they did it before deadline
    const completedBy8pm = submitted >= eligible;

    const poolAmount = weeklyPool(eligible, submitted, completedBy7pm && now.getUTCHours() < 1, completedBy8pm && now.getUTCHours() < 2);

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `CYCLE#${cycle.id}`,
        SK: `WEEK#${String(weekNum).padStart(3, '0')}`,
        cycle_id: cycle.id,
        week_number: weekNum,
        eligible_count: eligible,
        submission_count: submitted,
        participation_percent: eligible > 0 ? Math.round(submitted / eligible * 1000) / 10 : 0,
        pool_amount: poolAmount,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    }));

    return ok({ week: weekNum, submitted, eligible, pool_amount: poolAmount });
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to calculate weekly pool');
  }
};

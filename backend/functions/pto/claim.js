const { ddb, TABLE, GetCommand, PutCommand, QueryCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

function getWeekNumber(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

exports.handler = async (event) => {
  try {
    const cycleId = event.pathParameters?.id;
    const claims = event.requestContext?.authorizer?.claims || {};
    const employeeId = claims['custom:employee_id'] || claims.sub;

    if (!cycleId || !employeeId) return err(400, 'Missing cycle id or employee identity');

    // Confirm cycle is active
    const cycleRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `CYCLE#${cycleId}`, SK: '#META' },
    }));
    if (!cycleRes.Item) return err(404, 'Cycle not found');
    if (cycleRes.Item.status !== 'active') return err(400, 'Cycle is not active');

    // Confirm employee submitted this cycle (must have submitted to claim PTO bonus)
    const subRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `EMPLOYEE#${employeeId}`, SK: `CYCLE#${cycleId}#SUBMISSION` },
    }));
    if (!subRes.Item) return err(403, 'You must submit your report before claiming a PTO bonus');

    const weekNum = getWeekNumber(new Date());
    const now = new Date().toISOString();
    const ptoKey = `TOKEN#PTO#${cycleId}#W${weekNum}`;

    // One PTO claim per employee per week per cycle
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `EMPLOYEE#${employeeId}`,
        SK: ptoKey,
        cycle_id: cycleId,
        employee_id: employeeId,
        amount: 2,
        reason: 'pto_bonus',
        reference_id: `W${weekNum}`,
        created_at: now,
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    return ok({ tokens_earned: 2, week: weekNum });
  } catch (e) {
    if (e.name === 'ConditionalCheckFailedException') {
      return err(409, 'PTO bonus already claimed for this week');
    }
    console.error(e);
    return err(500, 'Failed to claim PTO bonus');
  }
};

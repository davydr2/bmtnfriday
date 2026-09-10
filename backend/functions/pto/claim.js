const { ddb, TABLE, GetCommand, PutCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

exports.handler = async (event) => {
  try {
    const cycleId = event.pathParameters?.id;
    const claims = event.requestContext?.authorizer?.claims || {};
    const employeeId = claims['custom:employee_id'] || claims.sub;

    if (!cycleId || !employeeId) return err(400, 'Missing cycle id or employee identity');

    const body = JSON.parse(event.body || '{}');
    const weeks = Array.isArray(body.weeks) ? body.weeks.map(Number).filter(n => n >= 1 && n <= 4) : [];
    const brag = typeof body.brag === 'string' ? body.brag.trim().slice(0, 200) : null;

    if (!weeks.length) return err(400, 'weeks must be a non-empty array of values 1–4');

    const cycleRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `CYCLE#${cycleId}`, SK: '#META' },
    }));
    if (!cycleRes.Item) return err(404, 'Cycle not found');
    if (cycleRes.Item.status !== 'active') return err(400, 'Cycle is not active');

    const subRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `EMPLOYEE#${employeeId}`, SK: `CYCLE#${cycleId}#SUBMISSION` },
    }));
    if (!subRes.Item) return err(403, 'You must submit your report before claiming a PTO bonus');

    const now = new Date().toISOString();
    const weeks_claimed = [];
    const weeks_already_claimed = [];

    for (const weekNum of weeks) {
      try {
        await ddb.send(new PutCommand({
          TableName: TABLE,
          Item: {
            PK: `EMPLOYEE#${employeeId}`,
            SK: `TOKEN#PTO#${cycleId}#CW${weekNum}`,
            cycle_id: cycleId,
            employee_id: employeeId,
            amount: 2,
            reason: 'pto_bonus',
            reference_id: `CW${weekNum}`,
            brag: brag || null,
            created_at: now,
          },
          ConditionExpression: 'attribute_not_exists(PK)',
        }));
        weeks_claimed.push(weekNum);
      } catch (e) {
        if (e.name === 'ConditionalCheckFailedException') {
          weeks_already_claimed.push(weekNum);
        } else {
          throw e;
        }
      }
    }

    return ok({ tokens_earned: weeks_claimed.length * 2, weeks_claimed, weeks_already_claimed });
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to claim PTO bonus');
  }
};

const { ddb, TABLE, GetCommand, UpdateCommand, PutCommand } = require('/opt/nodejs/db');
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

    const weekNum = getWeekNumber(new Date());
    const now = new Date().toISOString();

    // Attempt to claim the nag atomically
    try {
      const result = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `CYCLE#${cycleId}`, SK: `NAG#${weekNum}` },
        UpdateExpression: 'SET claimed_by = :emp, claimed_at = :now',
        ConditionExpression: 'attribute_exists(PK) AND claimed_by = :null',
        ExpressionAttributeValues: {
          ':emp': employeeId,
          ':now': now,
          ':null': null,
        },
        ReturnValues: 'ALL_NEW',
      }));

      const nag = result.Attributes;

      // Award 5 tokens
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `EMPLOYEE#${employeeId}`,
          SK: `TOKEN#${now}`,
          cycle_id: cycleId,
          employee_id: employeeId,
          amount: 5,
          reason: 'nag_claim',
          reference_id: `NAG#${weekNum}`,
          created_at: now,
        },
      }));

      return ok({
        claimed: true,
        message: nag.message,
        verification_code: nag.verification_code,
        tokens_earned: 5,
      });
    } catch (condErr) {
      if (condErr.name === 'ConditionalCheckFailedException') {
        return err(409, 'Nag already claimed or not yet available');
      }
      throw condErr;
    }
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to claim nag');
  }
};

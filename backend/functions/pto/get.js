const { ddb, TABLE, QueryCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

exports.handler = async (event) => {
  try {
    const cycleId = event.pathParameters?.id;
    const claims = event.requestContext?.authorizer?.claims || {};
    const employeeId = claims['custom:employee_id'] || claims.sub;

    if (!cycleId || !employeeId) return err(400, 'Missing cycle id or employee identity');

    const res = await ddb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `EMPLOYEE#${employeeId}`,
        ':prefix': `TOKEN#PTO#${cycleId}#CW`,
      },
    }));

    const claimed_weeks = (res.Items || []).map(item => {
      const match = item.reference_id?.match(/CW(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter(Boolean);

    const brags = {};
    for (const item of res.Items || []) {
      const match = item.reference_id?.match(/CW(\d+)/);
      if (match && item.brag) brags[parseInt(match[1])] = item.brag;
    }

    return ok({ claimed_weeks, brags });
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to get PTO status');
  }
};

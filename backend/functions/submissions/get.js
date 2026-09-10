const { ddb, TABLE, QueryCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

exports.handler = async (event) => {
  try {
    const cycleId = event.pathParameters?.id;
    if (!cycleId) return err(400, 'Missing cycle id');

    const result = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': `CYCLE#${cycleId}#SUBMISSIONS` },
      ScanIndexForward: true,
    }));

    return ok(result.Items);
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to fetch submissions');
  }
};

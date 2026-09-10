const { ddb, TABLE, QueryCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

exports.handler = async () => {
  try {
    const result = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      ExpressionAttributeValues: { ':type': 'EMPLOYEE' },
    }));
    return ok(result.Items);
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to fetch employees');
  }
};

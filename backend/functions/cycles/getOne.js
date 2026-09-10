const { ddb, TABLE, GetCommand, QueryCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

// Determine if the caller is an admin via Cognito groups
const isAdmin = (event) => {
  const claims = event.requestContext?.authorizer?.claims || {};
  const groups = claims['cognito:groups'] || '';
  return groups.includes('admin');
};

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return err(400, 'Missing cycle id');

    const result = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `CYCLE#${id}`, SK: '#META' },
    }));

    if (!result.Item) return err(404, 'Cycle not found');

    const cycle = { ...result.Item };

    // Only admins see the secret winning position
    if (!isAdmin(event)) {
      delete cycle.secret_winning_position;
    }

    return ok(cycle);
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to fetch cycle');
  }
};

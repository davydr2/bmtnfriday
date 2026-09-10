const { ddb, TABLE, GetCommand, QueryCommand, TransactWriteCommand } = require('/opt/nodejs/db');
const { created, err } = require('/opt/nodejs/response');
const { ulid } = require('ulid');

exports.handler = async (event) => {
  try {
    const cycleId = event.pathParameters?.id;
    const claims = event.requestContext?.authorizer?.claims || {};
    // employee_id stored in Cognito custom attribute or sub
    const employeeId = claims['custom:employee_id'] || claims.sub;

    if (!cycleId || !employeeId) return err(400, 'Missing cycle id or employee identity');

    // Load cycle
    const cycleRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `CYCLE#${cycleId}`, SK: '#META' },
    }));
    const cycle = cycleRes.Item;
    if (!cycle) return err(404, 'Cycle not found');
    if (cycle.status !== 'active') return err(400, 'Cycle is not active');

    // Confirm employee is on this cycle's roster
    const rosterRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `CYCLE#${cycleId}`, SK: `EMPLOYEE#${employeeId}` },
    }));
    if (!rosterRes.Item) return err(403, 'You are not on the roster for this cycle');

    // Check for duplicate submission
    const dupRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `EMPLOYEE#${employeeId}`, SK: `CYCLE#${cycleId}#SUBMISSION` },
    }));
    if (dupRes.Item) return err(409, 'You have already submitted for this cycle');

    // Determine the next position atomically using a counter item
    // We use a conditional update on a counter to get a unique position
    const counterKey = { PK: `CYCLE#${cycleId}`, SK: '#COUNTER' };
    const counterRes = await ddb.send(new GetCommand({ TableName: TABLE, Key: counterKey }));
    const currentCount = counterRes.Item?.count || 0;
    const newPosition = currentCount + 1;

    if (newPosition > cycle.eligible_count) {
      return err(400, 'All submission positions have been filled');
    }

    const now = new Date().toISOString();
    const id = ulid();

    await ddb.send(new TransactWriteCommand({
      TransactItems: [
        // Increment counter (optimistic lock on current count)
        {
          Update: {
            TableName: TABLE,
            Key: counterKey,
            UpdateExpression: 'SET #count = :new, updated_at = :now',
            ConditionExpression: 'attribute_not_exists(#count) OR #count = :current',
            ExpressionAttributeNames: { '#count': 'count' },
            ExpressionAttributeValues: {
              ':new': newPosition,
              ':current': currentCount,
              ':now': now,
            },
          },
        },
        // Record submission by position (ensures position uniqueness)
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `CYCLE#${cycleId}`,
              SK: `SUBMISSION#${String(newPosition).padStart(6, '0')}`,
              GSI1PK: `CYCLE#${cycleId}#SUBMISSIONS`,
              GSI1SK: now,
              id,
              cycle_id: cycleId,
              employee_id: employeeId,
              submission_position: newPosition,
              submitted_at: now,
              created_at: now,
            },
            ConditionExpression: 'attribute_not_exists(PK)',
          },
        },
        // Record submission by employee (prevents duplicates)
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `EMPLOYEE#${employeeId}`,
              SK: `CYCLE#${cycleId}#SUBMISSION`,
              cycle_id: cycleId,
              employee_id: employeeId,
              submission_position: newPosition,
              submitted_at: now,
              created_at: now,
            },
            ConditionExpression: 'attribute_not_exists(PK)',
          },
        },
        // Audit log
        {
          Put: {
            TableName: TABLE,
            Item: {
              PK: `AUDIT#${now}`,
              SK: id,
              actor_type: 'employee',
              actor_id: employeeId,
              action: 'submit_report',
              entity_type: 'cycle',
              entity_id: cycleId,
              metadata: { submission_position: newPosition },
              created_at: now,
            },
          },
        },
      ],
    }));

    return created({ submission_position: newPosition, submitted_at: now });
  } catch (e) {
    if (e.name === 'TransactionCanceledException') {
      // Retry once — position race condition
      return err(409, 'Submission conflict, please try again');
    }
    console.error(e);
    return err(500, 'Failed to submit report');
  }
};

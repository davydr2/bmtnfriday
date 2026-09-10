const { ddb, TABLE, GetCommand, QueryCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

const isAdmin = (event) => {
  const claims = event.requestContext?.authorizer?.claims || {};
  return (claims['cognito:groups'] || '').includes('admin');
};

exports.handler = async (event) => {
  if (!isAdmin(event)) return err(403, 'Admin only');

  try {
    const cycleId = event.pathParameters?.id;
    if (!cycleId) return err(400, 'Missing cycle id');

    // Load cycle (admin view — includes secret number)
    const cycleRes = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `CYCLE#${cycleId}`, SK: '#META' },
    }));
    const cycle = cycleRes.Item;
    if (!cycle) return err(404, 'Cycle not found');

    const secret = cycle.secret_winning_position;

    // Load all submissions for this cycle
    const subsRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': `CYCLE#${cycleId}#SUBMISSIONS` },
    }));
    const submissions = subsRes.Items || [];
    if (!submissions.length) return err(400, 'No submissions yet');

    const submitterIds = submissions.map(s => s.employee_id);

    // Load cycle roster entries (for starting_token_balance — previous winner handicap)
    const rosterEntries = {};
    await Promise.all(submitterIds.map(async (empId) => {
      const r = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `CYCLE#${cycleId}`, SK: `EMPLOYEE#${empId}` },
      }));
      rosterEntries[empId] = r.Item?.starting_token_balance || 0;
    }));

    // Load token ledger for each submitter this cycle
    const earned = {};
    await Promise.all(submitterIds.map(async (empId) => {
      const t = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `EMPLOYEE#${empId}`,
          ':sk': `TOKEN#`,
        },
        FilterExpression: 'cycle_id = :cid',
        ExpressionAttributeValues: {
          ':pk': `EMPLOYEE#${empId}`,
          ':sk': 'TOKEN#',
          ':cid': cycleId,
        },
      }));
      earned[empId] = (t.Items || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    }));

    // Load employee display names for alpha sort
    const employees = {};
    await Promise.all(submitterIds.map(async (empId) => {
      const e = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `EMPLOYEE#${empId}`, SK: '#PROFILE' },
      }));
      employees[empId] = e.Item?.display_name || empId;
    }));

    // Build token pool: sorted alphabetically, each employee occupies
    // max(0, starting_balance + earned_tokens) slots
    const pool = submitterIds
      .map(empId => ({
        empId,
        name: employees[empId],
        tokens: Math.max(0, (rosterEntries[empId] || 0) + (earned[empId] || 0)),
      }))
      .filter(e => e.tokens > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalTokens = pool.reduce((sum, e) => sum + e.tokens, 0);
    if (totalTokens === 0) return err(400, 'No tokens in pool — cannot determine winner');

    // Winning position via rollover: secret mod total
    const winningSlot = secret % totalTokens;

    // Walk the sorted pool to find who owns that slot
    let cursor = 0;
    let winner = null;
    for (const entry of pool) {
      if (winningSlot >= cursor && winningSlot < cursor + entry.tokens) {
        winner = entry;
        break;
      }
      cursor += entry.tokens;
    }

    return ok({
      winner: {
        employee_id: winner.empId,
        display_name: winner.name,
        tokens: winner.tokens,
      },
      pool_summary: pool.map(e => ({
        display_name: e.name,
        tokens: e.tokens,
        slots: `${pool.slice(0, pool.indexOf(e)).reduce((s, x) => s + x.tokens, 0)}–${pool.slice(0, pool.indexOf(e)).reduce((s, x) => s + x.tokens, 0) + e.tokens - 1}`,
      })),
      total_tokens: totalTokens,
      secret_number: secret,
      winning_slot: winningSlot,
    });
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to calculate winner');
  }
};

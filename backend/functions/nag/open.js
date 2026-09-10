const { ddb, TABLE, QueryCommand, PutCommand } = require('/opt/nodejs/db');
const { ok, err } = require('/opt/nodejs/response');

const NAG_MESSAGES = [
  'Your mom told you to do your report.',
  'The office plant is judging you. Submit your report.',
  'Your future self called. They said do the report.',
  'One small click for you, one giant pool contribution for team-kind.',
  'The coffee maker refuses to brew until your report is in.',
  'Legend has it the printer works better if you submit your report.',
  'Your report is feeling lonely. Give it some company.',
  "Management is not watching. Okay, maybe a little. Submit your report.",
  'The WiFi is secretly slower for non-submitters. Allegedly.',
  'Submit your report or the intern gets it.',
];

function getWeekNumber(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function verificationCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const L = letters[Math.floor(Math.random() * letters.length)];
  const L2 = letters[Math.floor(Math.random() * letters.length)];
  const L3 = letters[Math.floor(Math.random() * letters.length)];
  const N = Math.floor(Math.random() * 900) + 100;
  return `${L}${L2}${L3} ${N}`;
}

exports.handler = async () => {
  try {
    const now = new Date();
    const weekNum = getWeekNumber(now);

    // Find active cycle
    const cyclesRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':type': 'CYCLE', ':active': 'active' },
    }));

    if (!cyclesRes.Items?.length) return ok({ skipped: true, reason: 'no active cycle' });

    const cycle = cyclesRes.Items[0];
    const msg = NAG_MESSAGES[Math.floor(Math.random() * NAG_MESSAGES.length)];
    const code = verificationCode();
    const availableAt = now.toISOString();

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `CYCLE#${cycle.id}`,
        SK: `NAG#${weekNum}`,
        cycle_id: cycle.id,
        week: weekNum,
        available_at: availableAt,
        message: msg,
        verification_code: code,
        claimed_by: null,
        claimed_at: null,
        verified: false,
        created_at: availableAt,
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    return ok({ opened: true, week: weekNum });
  } catch (e) {
    if (e.name === 'ConditionalCheckFailedException') {
      return ok({ skipped: true, reason: 'nag already opened this week' });
    }
    console.error(e);
    return err(500, 'Failed to open nag window');
  }
};

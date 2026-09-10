const { ddb, TABLE, QueryCommand, PutCommand } = require('/opt/nodejs/db');

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
  const L1 = letters[Math.floor(Math.random() * letters.length)];
  const L2 = letters[Math.floor(Math.random() * letters.length)];
  const L3 = letters[Math.floor(Math.random() * letters.length)];
  const N = Math.floor(Math.random() * 900) + 100;
  return `${L1}${L2}${L3} ${N}`;
}

exports.handler = async () => {
  try {
    const now = new Date();
    const weekNum = getWeekNumber(now);
    const nowISO = now.toISOString();

    // Find active cycle
    const cyclesRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':type': 'CYCLE', ':active': 'active' },
    }));

    if (!cyclesRes.Items?.length) return { skipped: true, reason: 'no active cycle' };

    const cycle = cyclesRes.Items[0];
    const msg = NAG_MESSAGES[Math.floor(Math.random() * NAG_MESSAGES.length)];
    const code = verificationCode();

    // Open the nag in DynamoDB (idempotent — condition prevents double-open)
    try {
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `CYCLE#${cycle.id}`,
          SK: `NAG#${weekNum}`,
          cycle_id: cycle.id,
          week: weekNum,
          available_at: nowISO,
          message: msg,
          verification_code: code,
          claimed_by: null,
          claimed_at: null,
          verified: false,
          created_at: nowISO,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }));
    } catch (e) {
      if (e.name === 'ConditionalCheckFailedException') {
        return { skipped: true, reason: 'nag already opened this week' };
      }
      throw e;
    }

    // POST to Slack webhook
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🔔 *NAG IS LIVE!* Go to bmtnfriday.com and snag the nag — first one gets 5 tokens!\n_Today's nag:_ "${msg}"`,
          }),
        });
      } catch (slackErr) {
        // Log but don't fail — nag is open even if Slack is down
        console.error('Slack webhook failed:', slackErr.message);
      }
    }

    console.log(`Nag opened for week ${weekNum}, cycle ${cycle.id}`);
    return { opened: true, week: weekNum };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

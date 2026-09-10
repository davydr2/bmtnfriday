const { SchedulerClient, CreateScheduleCommand } = require('@aws-sdk/client-scheduler');
const { ddb, TABLE, QueryCommand } = require('/opt/nodejs/db');

const scheduler = new SchedulerClient({});

exports.handler = async () => {
  try {
    // Only proceed if there is an active cycle
    const cyclesRes = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :type',
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':type': 'CYCLE', ':active': 'active' },
    }));

    if (!cyclesRes.Items?.length) {
      return { skipped: true, reason: 'no active cycle' };
    }

    // Random offset: anywhere in the 30-minute window (0–1799 seconds)
    const offsetMs = Math.floor(Math.random() * 30 * 60 * 1000);
    const fireTime = new Date(Date.now() + offsetMs);

    // EventBridge Scheduler requires UTC without milliseconds: at(yyyy-mm-ddThh:mm:ss)
    const expression = `at(${fireTime.toISOString().slice(0, 19)})`;

    // Name is date-based so it's idempotent per Friday
    const name = `bmtnfriday-nag-${fireTime.toISOString().slice(0, 10).replace(/-/g, '')}`;

    await scheduler.send(new CreateScheduleCommand({
      Name: name,
      GroupName: 'default',
      ScheduleExpression: expression,
      FlexibleTimeWindow: { Mode: 'OFF' },
      Target: {
        Arn: process.env.NAG_FIRE_FUNCTION_ARN,
        RoleArn: process.env.SCHEDULER_ROLE_ARN,
        Input: '{}',
      },
      ActionAfterCompletion: 'DELETE',
    }));

    console.log(`Nag scheduled for ${fireTime.toISOString()} (offset ${Math.round(offsetMs / 60000)}m)`);
    return { scheduled: true, fireTime: fireTime.toISOString() };
  } catch (e) {
    // ConflictException = schedule already exists for today, safe to ignore
    if (e.name === 'ConflictException') {
      return { skipped: true, reason: 'already scheduled today' };
    }
    console.error(e);
    throw e;
  }
};

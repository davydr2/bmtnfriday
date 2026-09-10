const { ddb, TABLE, PutCommand } = require('/opt/nodejs/db');
const { created, err } = require('/opt/nodejs/response');
const { ulid } = require('ulid');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, starts_at, ends_at, eligible_count } = body;

    if (!name || !starts_at || !ends_at || !eligible_count) {
      return err(400, 'name, starts_at, ends_at, eligible_count are required');
    }

    const count = parseInt(eligible_count, 10);
    if (count < 1) return err(400, 'eligible_count must be >= 1');

    // Secret number used to traverse the token pool at cycle end.
    // Range 1001–9999 so it always wraps the pool multiple times.
    const secret_winning_position = Math.floor(Math.random() * 8999) + 1001;

    const id = ulid();
    const now = new Date().toISOString();

    const item = {
      PK: `CYCLE#${id}`,
      SK: '#META',
      GSI1PK: 'CYCLE',
      GSI1SK: starts_at,
      id,
      name,
      starts_at,
      ends_at,
      eligible_count: count,
      secret_winning_position,
      status: 'draft',
      created_at: now,
      updated_at: now,
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

    // Return item without the secret position
    const { secret_winning_position: _, ...safe } = item;
    return created(safe);
  } catch (e) {
    console.error(e);
    return err(500, 'Failed to create cycle');
  }
};

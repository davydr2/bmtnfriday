const { ddb, TABLE, PutCommand } = require('/opt/nodejs/db');
const { created, err } = require('/opt/nodejs/response');
const { ulid } = require('ulid');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { employee_code, display_name, email, active = true } = body;

    if (!employee_code || !display_name) {
      return err(400, 'employee_code and display_name are required');
    }

    const id = ulid();
    const now = new Date().toISOString();

    const item = {
      PK: `EMPLOYEE#${id}`,
      SK: '#PROFILE',
      GSI1PK: 'EMPLOYEE',
      GSI1SK: display_name.toLowerCase(),
      id,
      employee_code,
      display_name,
      email,
      active,
      created_at: now,
      updated_at: now,
    };

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    return created(item);
  } catch (e) {
    if (e.name === 'ConditionalCheckFailedException') {
      return err(409, 'Employee already exists');
    }
    console.error(e);
    return err(500, 'Failed to create employee');
  }
};

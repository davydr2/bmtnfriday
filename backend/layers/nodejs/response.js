const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const ok = (body) => ({
  statusCode: 200,
  headers: CORS,
  body: JSON.stringify(body),
});

const created = (body) => ({
  statusCode: 201,
  headers: CORS,
  body: JSON.stringify(body),
});

const err = (statusCode, message) => ({
  statusCode,
  headers: CORS,
  body: JSON.stringify({ error: message }),
});

module.exports = { ok, created, err };

const assert = require('assert');
const { roleRouteAccess } = require('./roleAccess');

const makeReq = (role, path) => ({ user: { role }, baseUrl: '/api', path });
const makeRes = () => ({
  status(code) { this.code = code; return this; },
  json(payload) { this.payload = payload; return this; }
});

(async () => {
  let req = makeReq('teacher', '/students');
  let res = makeRes();
  let nextCalled = false;
  await roleRouteAccess(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);

  req = makeReq('teacher', '/fees/schedules');
  res = makeRes();
  nextCalled = false;
  await roleRouteAccess(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.code, 403);

  req = makeReq('parent', '/tasks');
  res = makeRes();
  nextCalled = false;
  await roleRouteAccess(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);

  console.log('roleAccess middleware tests passed');
})();

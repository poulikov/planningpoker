const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { test } = require('node:test');
const { Decoder } = require('socket.io-parser');

test('Socket.IO rejects zero and excessive binary attachment counts', () => {
  for (const count of [0, 1000000]) {
    const decoder = new Decoder();
    assert.throws(() => decoder.add(`5${count}-["upload"]`));
    decoder.destroy();
  }
});

test('Socket.IO still decodes ordinary events and binary attachments', () => {
  const decoder = new Decoder();
  const packets = [];
  decoder.on('decoded', packet => packets.push(packet));
  decoder.add('2["ping"]');
  decoder.add('51-["upload",{"_placeholder":true,"num":0}]');
  decoder.add(Buffer.from('data'));
  assert.deepEqual(packets[0].data, ['ping']);
  assert.equal(packets[1].data[1].toString(), 'data');
  decoder.destroy();
});

// Run after npm run build, against a disposable database supplied in DATABASE_URL.
test('Zod upgrade preserves REST validation and valid session/task creation', async () => {
  assert.ok(process.env.DATABASE_URL, 'Set DATABASE_URL to a disposable test database');
  const port = process.env.TEST_PORT || '3291';
  const server = spawn(process.execPath, ['dist/index.js'], {
    cwd: require('node:path').join(__dirname, '..'),
    env: { ...process.env, PORT: port, NODE_ENV: 'development' },
    stdio: 'ignore',
  });
  const base = `http://127.0.0.1:${port}`;
  const post = (path, data) => fetch(base + path, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) {
      assert.equal(server.exitCode, null, 'Backend exited before readiness');
      try { ready = (await fetch(base + '/health')).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'Backend did not become ready');
    for (const data of [{}, { name: '', authorId: 'test' }, { name: 'test', authorId: 'test', votingTimeout: '120' }]) {
      const response = await post('/api/sessions', data);
      assert.equal(response.status, 400);
      assert.ok(Array.isArray((await response.json()).error));
    }
    const response = await post('/api/sessions', { name: 'Security regression', authorId: 'test' });
    assert.equal(response.status, 200);
    const session = await response.json();
    assert.equal(session.votingTimeout, 120);
    for (const sessionId of ['invalid-uuid', 42]) {
      const invalid = await post('/api/tasks', { sessionId, title: 'Task' });
      assert.equal(invalid.status, 400);
      assert.ok(Array.isArray((await invalid.json()).error));
    }
    const task = await post('/api/tasks', { sessionId: session.id, title: 'Valid task' });
    assert.equal(task.status, 200);
    assert.equal((await task.json()).sessionId, session.id);
  } finally {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
});

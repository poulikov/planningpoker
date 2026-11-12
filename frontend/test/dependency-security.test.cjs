const assert = require('node:assert/strict');
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


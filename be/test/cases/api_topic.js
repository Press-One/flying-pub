require('should');
const config = require('../../config');
const api = require('../api');

const generateName = () => 'test_topic_' + new Date().getTime();

it('can not create file when missing name', () => {
  const topic = {};
  return api.post(`/api/topics`)
    .send({
      payload: topic
    })
    .set('Cookie', [`${config.auth.tokenKey}=${global.token}`])
    .expect(400);
});

it('create topic', () => {
  const topic = {
    name: generateName(),
  };
  return api.post(`/api/topics`)
    .send({
      payload: topic
    })
    .set('Cookie', [`${config.auth.tokenKey}=${global.token}`])
    .expect(200);
});
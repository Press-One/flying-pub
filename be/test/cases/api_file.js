require('should');
const config = require('../../config');
const api = require('../api');

let fileId = null;
let draftId = null;

const generateTitle = () => 'test_file_title' + new Date().getTime();
const generateContent = () => 'test_file_content' + new Date().getTime();

it('can not create file when missing title', () => {
  const file = {
    content: generateTitle(),
    mimeType: 'text/markdown'
  };
  return api.post(`/api/files`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(400);
});

it('can not create file when missing content', () => {
  const file = {
    title: generateTitle(),
    mimeType: 'text/markdown'
  };
  return api.post(`/api/files`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(400);
});

it('can not create file when missing mimeType', () => {
  const file = {
    title: generateTitle(),
    content: generateContent()
  };
  return api.post(`/api/files`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(400);
});

it('create file', () => {
  const file = {
    title: generateTitle(),
    content: generateContent(),
    mimeType: 'text/markdown'
  };
  return api.post(`/api/files`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(200)
    .then((res) => {
      fileId = res.body.id;
    });
});

it('create draft', () => {
  const file = {
    title: generateTitle(),
    content: 'draft_' + generateContent(),
    mimeType: 'text/markdown'
  };
  return api.post(`/api/files?type=DRAFT`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(200)
    .then((res) => {
      draftId = res.body.id;
      res.body.status.should.be.equal('draft');
    });
});

it('update draft', () => {
  const content = 'draft_' + generateContent();
  const file = {
    content
  };
  return api.put(`/api/files/${draftId}`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(200)
    .then((res) => {
      res.body.updatedFile.status.should.be.equal('draft');
      res.body.updatedFile.content.should.be.equal(content);
    });
});

it('publish draft', () => {
  const content = 'draft_' + generateContent();
  const file = {
    content
  };
  return api.put(`/api/files/${draftId}?action=PUBLISH`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(200)
    .then((res) => {
      res.body.updatedFile.rId.should.not.be.equal(null);
      res.body.updatedFile.status.should.be.equal('pending');
      res.body.updatedFile.content.should.be.equal(content);
    });
});

it('This file can not be updated because it\'s not published', () => {
  const file = {
    content: generateContent()
  };
  return api.put(`/api/files/${fileId}`)
    .send({
      payload: file
    })
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(400);
});

// const OTHERS_file_ID = 1069;
// it('update file when no permission', () => {
//   const file = {
//     content: generateContent()
//   };
//   return api.put(`/api/files/${OTHERS_file_ID}`)
//     .send({ payload: file })
//     .set('Cookie', [`${config.authTokenKey}=${global.token}`])
//     .expect(400);
// });

it('list files', () => {
  return api.get(`/api/files`)
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(200);
});

it('get file', () => {
  return api.get(`/api/files/${fileId}`)
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(200);
});

it('get file with an invalid fileId', () => {
  return api.get(`/api/files/999999`)
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(404);
});

it('delete file', () => {
  return api.delete(`/api/files/${fileId}`)
    .set('Cookie', [`${config.authTokenKey}=${global.token}`])
    .expect(200);
});

// it('delete file when no permission', () => {
//   return api.delete(`/api/files/${OTHERS_file_ID}`)
//     .set('Cookie', [`${config.authTokenKey}=${global.token}`])
//     .expect(400);
// });
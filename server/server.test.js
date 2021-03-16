const request = require('supertest');

const extServer = { address: () => ({ port: 3000 }) };

test('server emits react rendered html', () => {
  request(extServer)
    .get('/')
    .expect('Content-Type', /html/)
    .expect(200)
    .end((err, res) => {
      expect(err).toBe(null);
      expect(res.text).toContain('html');
      expect(res.text).not.toContain('<div id="root"></div>');
    });
});

test('server emits client configuration', () => {
  const requiredConfig = [
    'REACT_APP_TILAVARAUS_API_URL',
    'REACT_APP_OIDC_CLIENT_ID',
    'REACT_APP_OIDC_URL',
    'REACT_APP_OIDC_SCOPE',
    'REACT_APP_TILAVARAUS_API_SCOPE'
  ];
  request(extServer)
    .get('/')
    .expect(200)
    .end((err, res) => {
      expect(err).toBe(null);
      requiredConfig.forEach((str) => expect(res.text).toContain(str));
    });
});

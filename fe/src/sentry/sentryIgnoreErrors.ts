const ignoreErrors = [
  /setPrompt/,
  /use remove/,
  /Failed to fetch/,
  /Cannot read property 'on' of undefined/,
  /Generator.next/,
  /Cannot read property 'source' of undefined/,
  /Cannot read property 'reject' of null/,
  /405 Method Not Allowed/,
  /404 Not Found/,
  /403 Forbidden/,
  /Could not establish connection/,
  /PromiseRejectionEvent/,
  /请求超时/,
  /似乎已断开与互联网的连接/,
  /null is not an object/,
  /Unexpected token '<'/
];

export default ignoreErrors;

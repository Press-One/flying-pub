const extractFm = text => {
  const matched = text.match(/---[\w\W\n]*---\n/g);
  if (!matched) {
    return {
      yaml: null,
      body: text
    };
  }
  return {
    yaml: matched[0],
    body: text.slice(matched[0].length)
  };
}

const yaml2Json = yaml => {
  const splitted = yaml.split('\n');
  const json = {};
  for (const item of splitted) {
    const isTarget = item.includes(': ');
    if (isTarget) {
      const [key, value] = item.split(': ');
      json[key] = value.trim();
    }
  }
  return json;
}

module.exports = text => {
  const {
    yaml,
    body
  } = extractFm(text);
  const json = yaml2Json(yaml);
  return {
    attributes: json,
    body
  }
}
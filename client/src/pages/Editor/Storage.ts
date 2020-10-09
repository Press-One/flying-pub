const CACHE_PREFIX = 'FILE_EDITOR_CACHE_';

const getKey = (id: any, columnKey: string) => {
  if (id) {
    return `${CACHE_PREFIX}_DRAFT_${id}_${columnKey}`;
  }
  return `${CACHE_PREFIX}_NEW_FILE_${columnKey}`;
};

export const get = (id: any, columnKey: string) => {
  const key = getKey(id, columnKey);
  return localStorage.getItem(key);
};

export const set = (id: any, columnKey: string, value: any) => {
  const key = getKey(id, columnKey);
  localStorage.setItem(key, value);
};

export const remove = (id: any, columnKey: string) => {
  const key = getKey(id, columnKey);
  localStorage.removeItem(key);
};

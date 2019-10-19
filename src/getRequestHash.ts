export function getRequestHash(url: string, method: string, params: any = null) {
  const urlStringify = JSON.stringify(url);
  const methodStringify = JSON.stringify(method);
  const paramsStringify = JSON.stringify(params);
  return btoa(urlStringify + methodStringify + paramsStringify);
}

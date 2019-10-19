import { SucceededFn, FailedFn } from '../types';

export function fetchResolver(fetchConfig: any) {
  // example with url = https://website/articles/1
  // regex will extract 'articles' in order to use it as resourceType
  const { url } = fetchConfig;

  // eslint-disable-next-line max-len
  const regexURL = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b\/([-a-zA-Z0-9()@:%_+.~#&=]*)(\/)?([-a-zA-Z0-9()@:%_+.~#?&=]*)([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/;
  const match = url.match(regexURL);

  if (!match) {
    throw new Error('fetch URL doesn\'t match REST endpoint format');
  }

  const resourceType = url.match(regexURL)[2];

  if (!resourceType) {
    throw new Error('fetch URL doesn\'t match REST endpoint format. it must contain a resource type');
  }

  const resourceId = url.match(regexURL)[4] || null;

  const queryString = url.split('?')[1];
  const queryParams = !queryString
    ? {}
    : queryString
      .split('&')
      .map((chunk: string) => chunk.split('='))
      .reduce((a: object, b: string[]) => ({ ...a, [b[0]]: b[1] }), { });

  return {
    url: fetchConfig.url,
    method: fetchConfig.method,
    resourceType,
    resourceId,
    params: queryParams,
    request: (succeeded: SucceededFn, failed: FailedFn) => {
      fetch(url, fetchConfig)
        .then((response) => {
          succeeded({
            raw: response,
            data: response.json(),
          });
        })
        .catch((response) => {
          failed({
            raw: response,
          });

          // Here, you can trigger a notification error
        });
    },
  };
}

import { SucceededFn, FailedFn } from '../types';

export function createAxiosResolver(axiosInstance: any) {
  return function axiosResolver(axiosConfig: any) {
    // example with url = /articles/1
    // regex will extract 'articles' in order to use it as resourceType
    const regexURL = /(\/)?([-a-zA-Z0-9()@:%_+.~#?&=]*)(\/)?([-a-zA-Z0-9()@:%_+.~#?&=]*)([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
    const match = axiosConfig.url.match(regexURL);

    if (!match) {
      throw new Error('axios URL doesn\'t match REST endpoint format');
    }

    const resourceType = axiosConfig.url.match(regexURL)[2];

    if (!resourceType) {
      throw new Error('axios URL doesn\'t match REST endpoint format. It must contain a resource type');
    }

    const resourceId = axiosConfig.url.match(regexURL)[4] || null;

    return {
      url: axiosConfig.url,
      method: axiosConfig.method,
      resourceType,
      resourceId,
      params: axiosConfig.params,
      request: (succeeded: SucceededFn, failed: FailedFn) => {
        axiosInstance.request(axiosConfig)
          .then((response: any) => {
            succeeded({
              raw: response,
              data: response.data,
            });
          })
          .catch((response: any) => {
            failed({
              raw: response,
            });

          // Here, you can trigger a notification error
          });
      },
    };
  };
}

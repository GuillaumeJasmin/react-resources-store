import { useContext, useState, useCallback } from 'react';
import { Context } from './context';
import { KEY } from './contants';
import { getRequestHash } from './getRequestHash';

const methodsToType = {
  GET: 'UPDATE',
  POST: 'UPDATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

interface Options {
  requestKey?: string
}

type UseLazyRequestOutput<Data, Params> = [
  (params: Params) => Promise<Data>,
  {
    requestIsPending: boolean,
  }
]

type RequestArgs<Params> = object | ((params: Params) => object);

export function useLazyRequest<Params = void, Data = void>(
  requestArgs: RequestArgs<Params>,
  options: Options = {},
): UseLazyRequestOutput<Data, Params> {
  const { store, resolver } = useContext(Context);
  const [requestIsPending, setRequestIsPending] = useState(false);

  const metadata = {
    requestIsPending,
  };

  const lazyRequest = useCallback(
    (localParams: Params): Promise<Data> => {
      const argsRequestHandled = typeof requestArgs === 'function'
        ? requestArgs(localParams)
        : requestArgs;

      const {
        url,
        method,
        resourceId,
        request: resquestTrigger,
        params,
        resourceType,
        requestKey = (url ? getRequestHash(url, method, params) : ''),
      } = resolver(argsRequestHandled);

      if (!requestKey) {
        throw new Error('react-resource-store: requestKey is required from resolver');
      }

      // @ts-ignore
      const type = methodsToType[method.toUpperCase()];
      const pendingType = `${type}_PENDING`;
      const succeededType = `${type}_SUCCEEDED`;
      const failedType = `${type}_FAILED`;
      const action = {
        key: KEY,
        requestKey,
        resourceType,
      };

      store.dispatch({
        ...action,
        type: pendingType,
      });

      setRequestIsPending(true);

      return new Promise((resolve, reject) => {
        resquestTrigger(
          (succeededData) => {
            const isDelete = method.toUpperCase() === 'DELETE';
            if (!isDelete) {
              store.dispatch({
                ...action,
                type: succeededType,
                payload: succeededData.data,
              });

              const readRequestKey = options.requestKey;

              if (readRequestKey) {
                const ids = Array.isArray(succeededData.data)
                  ? succeededData.data.map((item) => item.id)
                  : [succeededData.data.id];

                store.dispatch({
                  key: KEY,
                  type: 'INSERT_REQUEST_RESOURCE',
                  resourceType,
                  requestKey: readRequestKey,
                  ids,
                });
              }
            } else {
              store.dispatch({
                ...action,
                type: succeededType,
                payload: [resourceId],
              });
            }
            resolve(succeededData.raw);
            setRequestIsPending(false);
          },
          (failedData) => {
            store.dispatch({
              ...action,
              type: failedType,
            });

            reject(new Error(failedData.raw));
            setRequestIsPending(false);
          },
        );
      });
    },
    // must disable eslint waring because argsRequest is not memoize
    // eslint-disable-next-line
    [resolver, store],
  );

  return [lazyRequest, metadata];
}

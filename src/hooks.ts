import { useContext, useState, useMemo, useRef, useCallback } from 'react';
import { Unsubscribe } from 'redux';
import uniqid from 'uniqid';
import { useMount } from './hooks/useMount';
import { AxiosReduxContext } from './context';
import { KEY } from './contants';
import { createRequest } from './createRequest';
import { getRequestResources } from './getRequestResources';
import { getRequest } from './getRequest';

const methodsToType = {
  GET: 'UPDATE',
  POST: 'UPDATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

function getRequestKey(url: string, method: string, params: any) {
  const urlStringify = JSON.stringify(url);
  const methodStringify = JSON.stringify(method);
  const paramsStringify = JSON.stringify(params);
  return btoa(urlStringify + methodStringify + paramsStringify) || uniqid();
}

export function useRequest<Data = any>(...argsRequest: any): [Data, boolean, { requestKey: string }] {
  const { store, config, resolver } = useContext(AxiosReduxContext);
  const [, setLastUpdate] = useState<number>(0);
  const refSelector = useRef(null);

  const {
    url,
    method,
    request: resquestTrigger,
    params,
    resourceType,
  } = createRequest({
    resolver,
    argsRequest,
  });

  const requestKey = useMemo(() => getRequestKey(url, method, params), [url, method, params]);
  const request = getRequest(store.getState(), resourceType, requestKey);
  const requestIsPending = !request || request.status !== 'SUCCEEDED';
  const hasCache = !!request;

  const isGet = method.toUpperCase() === 'GET';

  let data = null;

  if (isGet) {
    data = getRequestResources(refSelector, config, store.getState(), resourceType, requestKey);
  }

  useMount(() => {
    let unsubscribe: Unsubscribe;

    if (isGet) {
      unsubscribe = store.subscribe(() => {
        // force refresh
        setLastUpdate(Date.now());
      });
    }

    // if request already exist, abort request
    if (hasCache) {
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
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

    resquestTrigger(
      (succeededData) => {
        store.dispatch({
          ...action,
          type: succeededType,
          payload: succeededData.data,
        });
      },
      (/* failedData */) => {
        store.dispatch({
          ...action,
          type: failedType,
        });
      },
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });

  return [data, requestIsPending, { requestKey }];
}

export function useLazyRequest<Params = any, Data = any>(...argsRequest: any): [(params: Params) => Promise<Data>, boolean] {
  const { store, resolver } = useContext(AxiosReduxContext);
  const [loading, setLoading] = useState(false);

  const lazyRequest = useCallback(
    (localParams: Params): Promise<Data> => {
      const argsRequestHandled = argsRequest.map((arg: any) => (typeof arg === 'function'
        ? arg(localParams)
        : arg));

      const {
        url,
        method,
        resourceId,
        request: resquestTrigger,
        params,
        resourceType,
      } = createRequest({
        resolver,
        argsRequest: argsRequestHandled,
      });

      const requestKey = getRequestKey(url, method, params);

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

      setLoading(true);

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

              // TODO: this works only for axios
              const readRequestKey = argsRequestHandled.length > 1 ? argsRequestHandled[1] : null;

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
            setLoading(false);
          },
          (failedData) => {
            store.dispatch({
              ...action,
              type: failedType,
            });

            reject(new Error(failedData.raw));
            setLoading(false);
          },
        );
      });
    },
    // must disable eslint waring because argsRequest is not memoize
    // eslint-disable-next-line
    [resolver, store],
  );

  return [lazyRequest, loading];
}

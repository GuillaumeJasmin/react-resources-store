import { useCallback, useContext, useState, useRef } from 'react';
import { Options } from './types';
import { Context } from './context';
import { getRequestHash } from './getRequestHash';
import { useMount } from './hooks/useMount';
import { getRequest } from './getRequest';
import { getRequestResources } from './getRequestResources';
import { KEY } from './contants';

const methodsToType = {
  GET: 'UPDATE',
  POST: 'UPDATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

type UseRequestOutput<Data = any> = [
  Data,
  {
    loading: boolean, // loading is false is there is data from cache
    requestPending: boolean
  }
]

export function useRequest(fetchArgs: any, options: Options = {}): UseRequestOutput {
  const { resolver, store, config } = useContext(Context);
  const isMountedRef = useRef(false);
  const isMounted = isMountedRef.current;
  const refSelector = useRef(null);
  const refData = useRef(null);
  const requestPendingRef = useRef(true);
  const [, forceUpdate] = useState(Date.now());

  const metadata = {
    loading: false,
    requestPending: false,
  };

  const fetchPolicy = options.fetchPolicy || 'cache-first';

  const {
    url,
    method,
    params,
    request: triggerRequest,
    resourceType,
    // resourceId,
  } = resolver(fetchArgs);

  const allowCache = (
    fetchPolicy === 'cache-first'
    || fetchPolicy === 'cache-and-network'
    || fetchPolicy === 'cache-only'
  );

  const allowNetwork = (
    fetchPolicy === 'cache-first'
    || fetchPolicy === 'cache-and-network'
    || fetchPolicy === 'network-only'
  );

  const requestHash = getRequestHash(url, method, params);
  const request = getRequest(store.getState(), resourceType, requestHash);
  const requestExist = !!request;
  const requestIsCached = allowCache && !!request;

  const enableCache = allowCache && (requestExist || fetchPolicy === 'cache-only');
  const forceNetwork = fetchPolicy === 'cache-and-network' || fetchPolicy === 'network-only';
  const enableNetwork = allowNetwork && (forceNetwork || !requestExist);

  if (!isMounted && enableNetwork) {
    metadata.requestPending = true;
  }

  if (!isMounted && !enableCache) {
    metadata.loading = true;
  }

  if (!metadata.loading) {
    refData.current = getRequestResources(
      refSelector,
      config,
      store.getState(),
      resourceType,
      requestHash,
      options.includedResources,
    );
  }

  const fetch = useCallback(() => {
    // @ts-ignore
    const type = methodsToType[method.toUpperCase()];
    const succeededType = `${type}_SUCCEEDED`;
    const failedType = `${type}_FAILED`;
    const action = {
      key: KEY,
      requestKey: requestHash,
      resourceType,
    };

    triggerRequest(
      (succeededData) => {
        requestPendingRef.current = false;
        store.dispatch({
          ...action,
          type: succeededType,
          payload: succeededData.data,
        });
      },
      (/* failedData */) => {
        requestPendingRef.current = false;
        store.dispatch({
          ...action,
          type: failedType,
        });
      },
    );
  }, [method, requestHash, resourceType, triggerRequest, store]);

  useMount(() => {
    isMountedRef.current = true;

    const isGet = method.toUpperCase() === 'GET';
    if (isGet) {
      store.subscribe(() => {
        const nextData = getRequestResources(refSelector, config, store.getState(), resourceType, requestHash);
        if (refData.current !== nextData) {
          forceUpdate(Date.now());
        }
      });
    }

    if (
      fetchPolicy === 'cache-and-network'
      || fetchPolicy === 'network-only'
      || (fetchPolicy === 'cache-first' && !requestIsCached)
    ) {
      fetch();
    }
  });

  return [refData.current, metadata];
}

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
    requestKey: string,
    loading: boolean, // loading is false is there is data from cache
    requestPending: boolean,
    refetch: () => void
  }
]

export function useRequest<Data = any>(requestArgs: any, options: Options = {}): UseRequestOutput<Data> {
  const { resolver, store, schema } = useContext(Context);
  const isMountedRef = useRef(false);
  const isMounted = isMountedRef.current;
  const refSelector = useRef(null);
  const refData = useRef<any>(null);
  const requestPendingRef = useRef(false);
  const [, forceUpdate] = useState(Date.now());

  const metadata = {
    requestKey: '',
    loading: false,
    requestPending: false,
    refetch: () => {},
  };

  const fetchPolicy = options.fetchPolicy || 'cache-first';

  const {
    url,
    method,
    params,
    request: triggerRequest,
    resourceType,
  } = resolver(requestArgs);

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

  metadata.requestPending = (!isMounted && enableNetwork) || requestPendingRef.current;
  metadata.requestKey = requestHash;

  if (!isMounted && !enableCache) {
    metadata.loading = true;
  }

  if (!metadata.loading) {
    refData.current = getRequestResources(
      refSelector,
      schema,
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

    return triggerRequest(
      (succeededData) => {
        // setRequestIsPending(false);
        requestPendingRef.current = false;
        store.dispatch({
          ...action,
          type: succeededType,
          payload: succeededData.data,
        });
      },
      (/* failedData */) => {
        // setRequestIsPending(false);
        requestPendingRef.current = false;
        store.dispatch({
          ...action,
          type: failedType,
        });
      },
    );
  }, [method, requestHash, resourceType, triggerRequest, store]);

  metadata.refetch = useCallback(() => {
    requestPendingRef.current = true;
    forceUpdate(Date.now());

    return fetch();
  }, [fetch]);

  useMount(() => {
    isMountedRef.current = true;

    const isGet = method.toUpperCase() === 'GET';
    if (isGet) {
      store.subscribe(() => {
        const nextData = getRequestResources(refSelector, schema, store.getState(), resourceType, requestHash, options.includedResources);
        if (refData.current !== nextData) {
          forceUpdate(Date.now());
        }
      });
    } else {
      throw new Error('useRequest() support only GET HTTP method');
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

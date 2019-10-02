import { useContext, useState, useMemo, useRef, useCallback } from 'react';
import { Unsubscribe } from 'redux';
import uniqid from 'uniqid';
import { AxiosPromise, AxiosResponse } from 'axios';
import filter from 'lodash/filter';
import { useMount } from './hooks/useMount';
import { AxiosReduxContext } from './context';
import { AxiosRequestConfig, ResourceState } from './types';
import { KEY } from './contants';

const methodsToType = {
  GET: 'READ',
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

function getResourceInfos(config: any) {
  const [resourceType, resourceId] = config.url.split('/');
  return { resourceType, resourceId };
}

function getResources(state: any, resourceType: string, selector: any): any {
  return selector(state[resourceType].resources);
}

function resolverAll(config: AxiosRequestConfig) {
  return (resources: ResourceState['resources']) => filter(resources, config.params.filter.where);
}

function resolverOne(resourceId: string) {
  return (resources: ResourceState['resources']) => resources[resourceId];
}

function getRequestKey(config: AxiosRequestConfig) {
  const urlStringify = JSON.stringify(config.url);
  const methodStringify = JSON.stringify(config.method);
  const paramsStringify = JSON.stringify(config.params);
  return btoa(urlStringify + methodStringify + paramsStringify) || uniqid();
}

export function useRequest<Data = any>(config: AxiosRequestConfig): [Data, boolean] {
  const { store, api } = useContext(AxiosReduxContext);
  const [, setLastUpdate] = useState<number>(0);
  const refConfig = useRef(config);
  const requestKey = useMemo(() => getRequestKey(refConfig.current), []);
  const { resourceType, resourceId } = useMemo(
    () => getResourceInfos(refConfig.current),
    [],
  );
  const hasCache = !!store.getState()[resourceType].requests[requestKey];
  const [loading, setLoading] = useState(!hasCache);

  const isGet = config.method.toUpperCase() === 'GET';

  let data = null;

  if (isGet) {
    data = resourceId
      ? getResources(store.getState(), resourceType, resolverOne(resourceId))
      : getResources(store.getState(), resourceType, resolverAll(config));
  }

  useMount(() => {
    let unsubscribe: Unsubscribe;

    // if request already exist, abort request
    if (hasCache) {
      if (isGet) {
        // listen next updtae only after api response
        unsubscribe = store.subscribe(() => {
          // force refresh
          setLastUpdate(Date.now());
        });
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }

    // @ts-ignore
    const type = methodsToType[config.method.toUpperCase()];

    store.dispatch({
      key: KEY,
      type: `${type}_PENDING`,
      requestKey,
      resourceType,
      resourceId,
    });

    api.request(config).then((response: AxiosResponse) => {
      setLoading(false);

      if (isGet) {
        // listen next updtae only after api response
        unsubscribe = store.subscribe(() => {
          // force refresh
          setLastUpdate(Date.now());
        });
      }

      store.dispatch({
        key: KEY,
        type: `${type}_SUCCEEDED`,
        requestKey,
        resourceType,
        payload: response.data,
        resourceId,
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });

  return [data, loading];
}

export function useLazyRequest<Params = any, Data = any>(
  fn: (params: Params) => AxiosRequestConfig,
): [(params: Params) => AxiosPromise<Data>, boolean] {
  const { store, api } = useContext(AxiosReduxContext);
  const [loading, setLoading] = useState(false);

  const lazyRequest = useCallback(
    (params: Params): AxiosPromise<Data> => {
      const config = fn(params);
      const requestKey = getRequestKey(config);
      const { resourceType, resourceId } = getResourceInfos(config);

      // @ts-ignore
      const type = methodsToType[config.method.toUpperCase()];

      store.dispatch({
        key: KEY,
        type: `${type}_PENDING`,
        requestKey,
        resourceType,
        resourceId,
      });

      setLoading(true);

      return api.request(config).then((response: AxiosResponse) => {
        store.dispatch({
          key: KEY,
          type: `${type}_SUCCEEDED`,
          requestKey,
          resourceType,
          payload: response.data,
          resourceId,
        });

        setLoading(false);

        return response;
      });
    },
    // eslint-disable-next-line
    [api, store]
  );

  return [lazyRequest, loading];
}

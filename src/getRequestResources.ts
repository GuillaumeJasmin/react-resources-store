import { ReducersConfig, StoreState } from './types';
import { getResourcesFromIds } from './getResourcesFromIds';
import { getRequest } from './getRequest';

interface Ref {
  current: any
}

export function getRequestResources(
  refSelector: Ref,
  config: ReducersConfig,
  state: StoreState<any>,
  resourceType: string,
  requestKey: string,
  includedResourcesParams?: any,
) {
  const request = getRequest(state, resourceType, requestKey);

  if (!request || request.status !== 'SUCCEEDED') {
    return null;
  }

  const { includedResources, ids, isList } = request;

  const idsParams = isList
    ? ids
    : ids[0];

  return getResourcesFromIds(
    refSelector,
    config,
    state,
    resourceType,
    idsParams,
    {
      ...includedResources,
      ...includedResourcesParams,
    },
  );
}

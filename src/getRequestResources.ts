import { ReducersConfig, StoreState } from './types';
import { getRequestResourcesId } from './getRequestResourcesId';
import { getResourcesFromIds } from './getResourcesFromIds';

interface Ref {
  current: any
}

export function getRequestResources(
  refSelector: Ref,
  config: ReducersConfig,
  state: StoreState<any>,
  resourceType: string,
  requestKey: string,
) {
  const ids = getRequestResourcesId(state, resourceType, requestKey);
  const { includedResources } = state[resourceType].requests[requestKey];

  return getResourcesFromIds(
    refSelector,
    config,
    state,
    resourceType,
    ids,
    includedResources,
  );
}

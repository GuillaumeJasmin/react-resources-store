import { ReducersConfig, StoreState, IncludedResourceParams } from './types';
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
  includedResources?: IncludedResourceParams,
) {
  const ids = getRequestResourcesId(state, resourceType, requestKey);
  return getResourcesFromIds(
    refSelector,
    config,
    state,
    resourceType,
    ids,
    includedResources,
  );
}

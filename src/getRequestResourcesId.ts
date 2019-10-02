import { StoreState } from './types';

export function getRequestResourcesId(
  state: StoreState<any>,
  resourceType: string,
  requestKey: string,
) {
  const stateSlice = state[resourceType];

  if (!stateSlice) {
    throw new Error(`resourceType ${resourceType} doesn't exist`);
  }

  const request = stateSlice.requests[requestKey];

  if (!request) {
    throw new Error(`request ${requestKey} doesn't exist in ${resourceType} reducer`);
  }

  return request.ids;
}

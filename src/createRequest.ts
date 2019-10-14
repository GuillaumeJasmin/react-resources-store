import { Resolver } from './types';

interface Args {
  resolver: Resolver,
  argsRequest: any,
}

export function createRequest(args: Args) {
  const { resolver, argsRequest } = args;

  const {
    url,
    method,
    resourceType,
    resourceId,
    params,
    request,
  } = resolver(...argsRequest);

  return {
    url,
    method,
    resourceType,
    resourceId,
    params,
    request,
  };
}

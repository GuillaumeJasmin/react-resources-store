import { pickBy, mapValues } from 'lodash';
import { schema, normalize } from 'normalizr';
import { KEY } from './contants';
import { ResourceState, Action, ReducersConfig, Request } from './types';
import { getIncludedResourcesSchema } from './getIncludedResourcesSchema';

const initialState = {
  resources: {},
  requests: {},
};

export function createReducers(config: ReducersConfig) {
  const allSchemas = mapValues(config, (value, key) => new schema.Entity(key));

  Object.entries(config).forEach(([key, schemaConfig]) => {
    const schema = allSchemas[key];
    schema.define(
      mapValues(schemaConfig, (relation) => {
        const { resourceType, relationType } = relation;
        const isList = relationType === 'hasMany';
        const relationEntity = allSchemas[resourceType];

        return isList ? [relationEntity] : relationEntity;
      }),
    );
  });

  const reducers = mapValues(
    config,
    (value, resourceType) => (
      state: ResourceState = initialState,
      action: any,
    ): ResourceState => {
      if (action.key !== KEY) return state;

      const isMainResourceType = action.resourceType === resourceType;

      const axiosReduxAction: Action = action;

      const missingProperties = [];

      if (!action.resourceType) {
        missingProperties.push('resourceType');
      }

      if (missingProperties.length > 0) {
        throw new Error(
          `AxiosRedux - missing action properties: ${missingProperties.join(
            ', ',
          )}`,
        );
      }

      const { requestKey } = action;

      switch (axiosReduxAction.type) {
        case 'UPDATE_PENDING': {
          if (!isMainResourceType) return state;

          return {
            ...state,
            requests: {
              ...state.requests,
              [requestKey]: {
                requestKey,
                status: 'PENDING',
                ids: [],
                includedResources: {},
              },
            },
          };
        }

        case 'DELETE_PENDING': {
          if (!isMainResourceType) return state;

          return {
            ...state,
            requests: {
              ...state.requests,
              [requestKey]: {
                requestKey,
                status: 'PENDING',
                ids: action.payload,
                includedResources: {},
              },
            },
          };
        }

        case 'UPDATE_SUCCEEDED': {
          const payloadAsArray = Array.isArray(action.payload)
            ? action.payload
            : [action.payload];

          const normalizeData = normalize(payloadAsArray, [
            allSchemas[action.resourceType],
          ]);

          const resourcesSlice = normalizeData.entities[resourceType];

          if (!resourcesSlice) return state;

          const nextResources = {
            ...resourcesSlice,
            ...mapValues(state.resources, (resource, resourceId) => ({
              ...resource,
              ...resourcesSlice[resourceId],
            })),
          };

          const nextRequests: { [requestkey: string]: Request } = {};

          if (isMainResourceType) {
            nextRequests[requestKey] = {
              requestKey,
              status: 'SUCCEEDED',
              ids: normalizeData.result,
              includedResources: getIncludedResourcesSchema(config, resourceType, payloadAsArray),
            };
          }

          return {
            ...state,
            resources: nextResources,
            requests: {
              ...state.requests,
              ...nextRequests,
            },
          };
        }

        case 'DELETE_SUCCEEDED': {
          if (!isMainResourceType) return state;

          const formated = pickBy(
            state.resources,
            (value, resourceId) => !action.payload.includes(resourceId),
          );

          return {
            ...state,
            resources: formated,
            requests: {
              ...state.requests,
              [requestKey]: {
                requestKey,
                status: 'SUCCEEDED',
                ids: action.payload,
                includedResources: {},
              },
            },
          };
        }

        case 'DELETE_FAILED': {
          if (!isMainResourceType) return state;

          return {
            ...state,
            requests: {
              ...state.requests,
              [requestKey]: {
                requestKey,
                status: 'FAILED',
                ids: action.payload,
                includedResources: {},
              },
            },
          };
        }

        default:
          break;
      }

      if (axiosReduxAction.type.endsWith('_FAILED')) {
        return {
          ...state,
          requests: {
            ...state.requests,
            [requestKey]: {
              requestKey,
              status: 'FAILED',
              ids: [],
              includedResources: {},
            },
          },
        };
      }

      return state;
    },
  );

  return reducers;
}

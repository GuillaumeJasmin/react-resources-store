import { pickBy, mapValues } from 'lodash';
import { schema as normalizrSchema, normalize } from 'normalizr';
import { KEY } from './contants';
import { ResourceState, Action, Schema, Request } from './types';
import { getIncludedResourcesSchema } from './getIncludedResourcesSchema';

const initialState = {
  resources: {},
  requests: {},
};

export function createReducers(schema: Schema) {
  const allSchemas = mapValues(schema, (value, key) => new normalizrSchema.Entity(key));

  Object.entries(schema).forEach(([key, schemaConfig]) => {
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
    schema,
    (value, resourceType) => (
      state: ResourceState = initialState,
      action: any,
    ): ResourceState => {
      if (action.key !== KEY) return state;

      const isMainResourceType = action.resourceType === resourceType;

      const reactResourcesAction: Action = action;

      const missingProperties = [];

      if (!action.resourceType) {
        missingProperties.push('resourceType');
      }

      if (missingProperties.length > 0) {
        throw new Error(
          `ReactResourcesHook - missing action properties: ${missingProperties.join(
            ', ',
          )}`,
        );
      }

      const { requestKey } = action;

      switch (reactResourcesAction.type) {
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
                isList: false,
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
                ids: action.payload || [],
                includedResources: {},
                isList: false,
              },
            },
          };
        }

        case 'UPDATE_SUCCEEDED': {
          const isList = Array.isArray(action.payload);
          const payloadAsArray = isList
            ? action.payload
            : [action.payload];

          const normalizeData = normalize(payloadAsArray, [
            allSchemas[action.resourceType],
          ]);

          const resourcesSlice = normalizeData.entities[resourceType] || {};

          // if (!resourcesSlice) return state;

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
              includedResources: getIncludedResourcesSchema(schema, resourceType, payloadAsArray),
              isList,
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
              ...mapValues(state.requests, (request) => ({
                ...request,
                ids: request.ids.filter((id) => !action.payload.includes(id)),
              })),
              // ...state.requests,
              [requestKey]: {
                requestKey,
                status: 'SUCCEEDED',
                ids: action.payload,
                includedResources: {},
                isList: false,
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
                isList: false,
              },
            },
          };
        }

        case 'INSERT_REQUEST_RESOURCE': {
          if (!isMainResourceType) return state;

          return {
            ...state,
            requests: {
              ...state.requests,
              [requestKey]: {
                ...state.requests[requestKey],
                ids: [...state.requests[requestKey].ids, ...action.ids],
              },
            },
          };
        }

        default:
          break;
      }

      if (reactResourcesAction.type.endsWith('_FAILED')) {
        return {
          ...state,
          requests: {
            ...state.requests,
            [requestKey]: {
              requestKey,
              status: 'FAILED',
              ids: [],
              includedResources: {},
              isList: false,
            },
          },
        };
      }

      return state;
    },
  );

  return reducers;
}

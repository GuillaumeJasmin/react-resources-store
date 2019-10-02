import { pickBy, mapValues } from 'lodash';
import { schema, normalize } from 'normalizr';
import { KEY } from './contants';
import { ResourceState, Action, ReducersConfig, Request } from './types';

const initialState = {
  resources: {},
  requests: {},
};

export function createReducers(config: ReducersConfig) {
  const allSchemas = mapValues(config, (value, key) => new schema.Entity(key));

  Object.entries(config).forEach(([key, schemaConfig]: [string, any]) => {
    const schema = allSchemas[key];
    schema.define(
      mapValues(schemaConfig, (relation) => {
        const isList = Array.isArray(relation);
        const relationResourceType = isList ? relation[0] : relation;
        const relationEntity = allSchemas[relationResourceType];

        return isList ? [relationEntity] : relationEntity;
      }),
    );
  });

  return mapValues(
    config,
    (value, resourceType) => (
      state: ResourceState = initialState,
      action: any,
    ): ResourceState => {
      if (action.key !== KEY) return state;

      const isMainResourceType = action.resourceType === resourceType;

      // if (action.resourceType !== resourceType) return state

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
        case 'READ_PENDING':
        case 'CREATE_PENDING':
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
                ids: [action.resourceId],
              },
            },
          };
        }

        case 'READ_SUCCEEDED':
        case 'CREATE_SUCCEEDED':
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
            (value, index) => index !== action.resourceId,
          );

          return {
            ...state,
            resources: formated,
            requests: {
              ...state.requests,
              [requestKey]: {
                requestKey,
                status: 'SUCCEEDED',
                ids: [action.resourceId],
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
            },
          },
        };
      }

      return state;
    },
  );
}

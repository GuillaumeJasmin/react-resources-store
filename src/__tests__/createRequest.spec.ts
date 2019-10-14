import { createRequest } from '../createRequest';

describe('createRequest', () => {
  it('should return corrent arguments length', () => {
    const argsRequest = ['', {}];

    function requestResolver(...params: any) {
      expect(params).toHaveLength(argsRequest.length);
      return {
        url: '',
        method: '',
        resourceType: '',
        resourceId: null,
        params: {},
        request: () => null,
      };
    }

    const { request } = createRequest({
      resolver: requestResolver,
      argsRequest,
    });

    request(
      () => null,
      () => null,
    );
  });

  it('should request return correct data', () => {
    const argsRequest = ['', {}];

    const returnedData = {
      url: '/articles',
      method: 'GET',
      resourceType: 'articles',
      resourceId: null,
      params: {},
      request: () => {},
    };

    function requestResolver() {
      return returnedData;
    }

    const {
      url,
      method,
      resourceType,
      params,
    } = createRequest({
      resolver: requestResolver,
      argsRequest,
    });

    expect(method).toEqual(returnedData.method);
    expect(resourceType).toEqual(returnedData.resourceType);
    expect(params).toEqual(returnedData.params);
    expect(url).toEqual(returnedData.url);
  });

  it('should request succeeded and faield work', () => {
    const argsRequest = ['', {}];
    const succeededBase = jest.fn(() => null);
    const failedBase = jest.fn(() => null);

    const { request } = createRequest({
      resolver: () => ({
        url: '',
        method: 'GET',
        resourceType: 'articles',
        resourceId: null,
        params: {},
        request: (succeeded: any, failed: any) => {
          expect(succeeded === succeededBase).toBeTruthy();
          expect(failed === failedBase).toBeTruthy();
          succeeded();
          failed();
        },
      }),
      argsRequest,
    });

    request(succeededBase, failedBase);

    expect(succeededBase).toBeCalled();
    expect(failedBase).toBeCalled();
  });
});

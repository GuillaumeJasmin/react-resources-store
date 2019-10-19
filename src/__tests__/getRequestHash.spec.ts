import '../testUtils';
import { getRequestHash } from '../getRequestHash';

describe('getRequestHash', () => {
  it('should return same key', () => {
    const url = 'http://website.com/articles/1';
    const method = 'GET';
    const params = {
      pageSize: 20,
    };

    const requestHash1 = getRequestHash(url, method, params);
    const requestHash2 = getRequestHash(url, method, params);

    expect(requestHash1).toEqual(requestHash2);
  });

  it('shouldn\'t return same key', () => {
    const url = 'http://website.com/articles/1';
    const method = 'GET';
    const params = {
      pageSize: 10,
    };

    const params2 = {
      pageSize: 20,
    };

    const requestHash1 = getRequestHash(url, method, params);
    const requestHash2 = getRequestHash(url, method, params2);

    expect(requestHash1 === requestHash2).toBeFalsy();
  });
});

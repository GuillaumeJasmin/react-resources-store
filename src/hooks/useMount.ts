import { useEffect } from 'react';

/**
 * Triggers the function when the initial rendering occurs. You can pass options
 * in the second parameter:
 * - hook: by default uses the `useEffect` hook, but you can replace it with
 *   `useLayoutEffect` or `useMutationEffect` if needed.
 * @param {Function} fn function to call
 * @param {object} options
 * @return {void}
 */
export function useMount(fn: any, { hook = useEffect } = {}) {
  hook(() => fn(), []);
}

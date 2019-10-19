import { Buffer } from 'buffer';

if (typeof btoa === 'undefined') {
  // @ts-ignore
  global.btoa = (str) => {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

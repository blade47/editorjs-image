import type { UploadResponseFormat } from '../types/types';

/**
 * Check if passed object is a Promise
 * @param  object - object to check
 * @returns true if object is a Promise, false otherwise
 */
export default function isPromise(object: Promise<UploadResponseFormat>): object is Promise<UploadResponseFormat> {
  return (
    object !== null
    && object !== undefined
    && typeof object === 'object'
    && typeof object.then === 'function'
  );
}

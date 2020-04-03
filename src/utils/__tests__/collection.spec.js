
import * as util from '../collection';

describe('utils/obj', () => {
  it('clones deeply', () => {
    const object1 = {
      string: 'string',
      number: 123,
      bool: false,
      nul: null,
      date: new Date(),
      undef: undefined,
      inf: Infinity,
    };
    expect(util.cloneDeep(object1)).not.toEqual(object1);

    const object2 = {
      string: '',
      number: 0,
      bool: true,
      nul: null,
      undef: undefined,
    };
    const clonedObject2 = util.cloneDeep(object2);
    expect(clonedObject2).toEqual(object2);

    clonedObject2.string = 'something';
    // test mutation
    expect(clonedObject2.string).not.toEqual(object2.string);
  });

  it('checks emptiness', () => {
    expect(util.isEmpty(null)).toBeTruthy();
    expect(util.isEmpty('')).toBeTruthy();
    expect(util.isEmpty('1')).toBeFalsy();
    expect(util.isEmpty({})).toBeTruthy();
    expect(util.isEmpty([])).toBeTruthy();
    expect(util.isEmpty({ a: 1 })).toBeFalsy();
    expect(util.isEmpty(['a', { a: 1 }])).toBeFalsy();
  });

  it('composes a new object that picks selected properties of an object', () => {
    const object = { a: 1, b: '2', c: 3 };
    expect(util.pick(object)).toEqual({});
    const result = util.pick(object, ['a', 'c']);
    expect(result.a).toBeDefined();
    expect(result.b).toBeUndefined();
    expect(result.c).toBeDefined();
  });

  it('composes a new object that omits selected properties of an object', () => {
    const object = { a: 1, b: '2', c: 3 };
    expect(util.omit(object)).toEqual(object);
    const result = util.omit(object, ['a', 'c']);
    expect(result.a).toBeUndefined();
    expect(result.b).toBeDefined();
    expect(result.c).toBeUndefined();
  });

  it('composes a new object that picks a predicate passed in pickBy', () => {
    const object = { a: 1, b: null, c: 3, d: false, e: undefined, f: 0 };
    expect(util.pickBy(object)).toEqual({ a: 1, c: 3, f: 0 });
  });

  it('composes a new array by which uniqueness is computed using uniq', () => {
    const arr = [1, 2, 1, 4, 1, 3];
    expect(util.uniq(arr)).toEqual([1, 2, 4, 3]);
  });

  it('composes a new array by which uniqueness is computed using uniqBy', () => {
    const arr = [{ id: 'a' }, { id: 'a' }, { id: 'b' }, null, null, undefined];
    expect(util.uniqBy(arr, 'id')).toEqual([{ id: 'a' }, { id: 'b' }, null, undefined]);
  });

  it('recursively flattens array', () => {
    const arr = [1, [2, [3, [4, { a: 'a' }, null]], 5, undefined]];
    const result = [1, 2, 3, 4, { a: 'a' }, null, 5, undefined];
    expect(util.flattenDeep(arr)).toEqual(result);
  });
});

/**
 * Helper like _.memoize, but working good with object references and caching only last value,
 * best used to cache calculated values based on some components props
 * @param getter - function that returning base value to calculate on
 * @param iteratee - receiving getter value and returning caclulated value
 * @returns {function()} that returning updated value each time, getter returning new value
 */
const cache = (getter: () => any, iteratee: (any) => any): (() => any) => {
  const func = () => {
    const propVal = getter();
    if (func.prop !== propVal) {
      func.cache = iteratee(propVal);
      func.prop = propVal;
    }
    return func.cache;
  };
  func.prop = Symbol('prop not yet calculated');
  return func;
};

export const cache2 = (getter: () => any, getter2: () => any, iteratee: (any) => any): (() => any) => {
  const func = () => {
    const propVal = getter();
    const propVal2 = getter2();
    if (func.prop !== propVal && func.prop2 !== propVal2) {
      func.cache = iteratee(propVal, propVal2);
      func.prop = propVal;
      func.prop2 = propVal2;
    }
    return func.cache;
  };
  func.prop = Symbol('prop not yet calculated');
  func.prop2 = Symbol('prop not yet calculated');
  return func;
};

export default cache;

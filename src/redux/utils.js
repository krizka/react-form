import _ from 'underscore';

function isArray(a) {
  return Array.isArray(a);
}

function isObject(a) {
  return !Array.isArray(a) && typeof a === 'object' && a !== null;
}

function isStringValidNumber(str) {
  return !isNaN(str);
}

function flattenDeep(arr, newArr = []) {
  if (!isArray(arr)) {
    newArr.push(arr);
  } else {
    for (let i = 0; i < arr.length; i++) {
      flattenDeep(arr[i], newArr);
    }
  }
  return newArr;
}

// const makePathArray = (obj) => {
//   let path = [];
//   const flat = flattenDeep(obj);
//   flat.forEach((part) => {
//     if (typeof part === 'string') {
//       path = path.concat(
//         part
//           .replace(/\[(\d*)\]/gm, '.__int__$1')
//           .replace('[', '.')
//           .replace(']', '')
//           .split('.')
//           .map((d) => {
//             if (d.indexOf('__int__') === 0) {
//               return parseInt(d.substring(6), 10);
//             }
//             return d;
//           })
//       );
//     } else {
//       path.push(part);
//     }
//   });
//   return path;
// }

const makePathArray = (obj) => {
  return isArray(obj) ? obj : [obj];
};

function set(obj = {}, path, value) {
  const keys = makePathArray(path);
  let keyPart;

  if (typeof keys[0] === 'number' && !isArray(obj)) {
    obj = [];
  } else if (typeof keys[0] === 'string' && !isObject(obj)) {
    obj = {};
  }

  let cursor = obj;

  while (typeof (keyPart = keys.shift()) !== 'undefined' && keys.length) {
    if (typeof keys[0] === 'number' && !isArray(cursor[keyPart])) {
      cursor[keyPart] = [];
    }
    if (typeof keys[0] !== 'number' && !isObject(cursor[keyPart])) {
      cursor[keyPart] = {};
    }
    cursor = cursor[keyPart];
  }
  cursor[keyPart] = value;
  return obj;
}

function get(obj, path, def) {
  if (!path) {
    return obj;
  }
  const pathObj = makePathArray(path);
  const val = pathObj.reduce((current, pathPart) => (current !== undefined ? current[pathPart] : undefined), obj);
  return val !== undefined ? val : def;
}

function isShallowEqual(obj1, obj2) {
  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }
  for (var prop in obj1) {
    if (obj1[prop] !== obj2[prop]) {
      return false;
    }
  }
  return true;
}

function clone(val) {
  return JSON.parse(JSON.stringify(val));
}

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function queueDebounce(func, timeout) {
  let queue = [];
  const debounce = _.debounce(() => {
    queue.forEach(f => f());
    queue = [];
  }, timeout);
  return function res(...args) {
    queue.push(func.bind(null, ...args));
    debounce();
  };
}

export default {
  get,
  set,
  isObject,
  isArray,
  isShallowEqual,
  isEqual,
  clone,
  queueDebounce,
};

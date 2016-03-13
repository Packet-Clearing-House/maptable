function appendOptions(select, options, defaultValue) {
  options.forEach(f => {
    // Filter select
    const option = document.createElement('option');
    option.setAttribute('value', f.key);
    option.innerText = f.text;
    select.appendChild(option);
  });
  select.value = defaultValue;
}

function rangeToBool(el1, range, el2) {
  if (range === '=') {
    return parseInt(el1, 10) === parseInt(el2, 10);
  }
  if (range === '≠') {
    return parseInt(el1, 10) !== parseInt(el2, 10) && el1 !== '' && el2 !== '';
  }
  if (range === '>') {
    return parseInt(el1, 10) > parseInt(el2, 10) && el1 !== '' && el2 !== '';
  }
  if (range === '<') {
    return parseInt(el1, 10) < parseInt(el2, 10) && el1 !== '' && el2 !== '';
  }
  if (range === '≥') {
    return parseInt(el1, 10) >= parseInt(el2, 10) && el1 !== '' && el2 !== '';
  }
  if (range === '≤') {
    return parseInt(el1, 10) <= parseInt(el2, 10) && el1 !== '' && el2 !== '';
  }
  return true;
}

function extendRecursive(obj1, obj2) {
  if (!obj1) obj1 = {};
  if (!obj2) obj2 = {};
  Object.keys(obj2).forEach(p => {
    try {
      // Property in destination object set; update its value.
      if (obj2[p].constructor === Object) {
        obj1[p] = extendRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch (e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  });

  return obj1;
}

function sanitizeKey(k) {
  return k.toLowerCase().replace(/ /g, '_').replace(/"/g, '').replace(/'/g, '');
}

export default {
  rangeToBool: rangeToBool,
  appendOptions: appendOptions,
  extendRecursive: extendRecursive,
  sanitizeKey: sanitizeKey,
};

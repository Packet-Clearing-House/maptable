/* eslint no-unused-vars: 0 */
import utils from './utils';
import defaultOptions from './defaultOptions';
import MapTable from './maptable';

d3.maptable = function (target) {
  let maptableObject;
  const maptable = {};
  const options = {
    target: target,
    columns: {},
    data: {},
    map: null,
    filters: null,
    table: null,
  };

  maptable.map = function (mapOptions = {}) {
    if (!topojson) {
      throw new Error('Maptable requires topojson.js');
    }
    if (typeof(mapOptions.path) !== 'string') {
      throw new Error('MapTable: map not provided');
    }
    options.map = mapOptions;
    return maptable;
  };

  maptable.json = function (jsonPath) {
    options.data.type = 'json';
    options.data.path = jsonPath;
    return maptable;
  };

  maptable.csv = function (csvPath) {
    options.data.type = 'csv';
    options.data.path = csvPath;
    return maptable;
  };

  maptable.tsv = function (tsvPath) {
    options.data.type = 'tsv';
    options.data.path = tsvPath;
    return maptable;
  };

  maptable.filters = function (filtersOptions = {}) {
    options.filters = filtersOptions;
    return maptable;
  };

  maptable.table = function (tableOptions = {}) {
    options.table = tableOptions;
    return maptable;
  };

  maptable.columns = function (columns = {}) {
    options.columns = columns;
    return maptable;
  };

  maptable.render = function () {
    if (typeof(target) !== 'string' || !document.querySelector(target)) {
      throw new Error('MapTable: target not found');
    }

    if (!options.data || !options.data.path) {
      throw new Error('MapTable: Please provide the path for your dataset json|csv|tsv');
    }

    const customOptions = utils.extendRecursive(defaultOptions, options);
    maptableObject = new MapTable(target, customOptions);
  };
  return maptable;
};

if (!d3) {
  throw new Error('Maptable requires d3.js');
}

export default d3.maptable;

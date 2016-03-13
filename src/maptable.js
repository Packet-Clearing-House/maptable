import utils from './utils';

import GeoMap from './components/GeoMap';
import Filters from './components/Filters';
import Table from './components/Table';

export default class MapTable {
  constructor(target, options) {
    this.options = options;

    this.node = document.querySelector(target);

    if (this.options.data.type === 'json') {
      d3.json(this.options.data.path, this.loadData.bind(this));
    } else if (this.options.data.type === 'csv') {
      d3.csv(this.options.data.path, this.loadData.bind(this));
    } else if (this.options.data.type === 'tsv') {
      d3.tsv(this.options.data.path, this.loadData.bind(this));
    }
  }

  loadData(err, data) {
    if (err) {
      throw err;
    }
    this.rawData = data;
    this.setColumnDetails();
    this.data = data.slice(); // we clone data, so that we can filter it
    // Map
    if (this.options.map) {
      d3.json(this.options.map.path, (errGeoMap, jsonWorld) => {
        if (errGeoMap) {
          throw errGeoMap;
        }
        this.map = new GeoMap(this, this.options.map, jsonWorld);
      });
    }

    // Filters
    if (this.options.filters) {
      this.filters = new Filters(this);
    }

    // Table
    if (this.options.table) {
      this.table = new Table(this, this.options.table);
    }
  }

  setColumnDetails() {
    if (this.rawData.length === 0) {
      return;
    }
    const defaultColumns = {};

    Object.keys(this.rawData[0]).forEach(k => {
      let columnType = 'field';
      if (typeof(this.rawData[0][k]) === 'number') {
        columnType = 'number';
      }
      defaultColumns[k] = {
        title: k,
        type: columnType,
      };
    });
    this.columnDetails = utils.extendRecursive(defaultColumns, this.options.columns);
  }
}

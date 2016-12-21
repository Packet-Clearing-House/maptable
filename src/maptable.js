import utils from './utils';

import GeoMap from './components/GeoMap';
import Filters from './components/Filters';
import Table from './components/Table';

export default class MapTable {
  constructor(target, options) {
    this.options = options;

    this.node = document.querySelector(target);
    this.node.setAttribute('style', 'position:relative;');

    if (this.options.data.type === 'json') {
      d3.json(this.options.data.path, this.loadData.bind(this));
    } else if (this.options.data.type === 'csv') {
      d3.csv(this.options.data.path, this.loadData.bind(this));
    } else if (this.options.data.type === 'tsv') {
      d3.tsv(this.options.data.path, this.loadData.bind(this));
    }
  }

  /**
   * Callback used when we pull the dataset
   * @param err: Error - error data if it happened
   * @param data: Object - dataset object
   */
  loadData(err, data) {
    if (err) {
      throw err;
    }
    this.rawData = data;
    this.setColumnDetails();
    this.data = data.slice(); // we clone data, so that we can filter it
    // Map
    if (this.options.map) {
      // Map wrapper
      const mapWrapper = document.createElement('div');
      mapWrapper.setAttribute('class', 'mt-map-container');
      this.node.insertBefore(mapWrapper, this.node.firstChild);
      d3.json(this.options.map.path, (errGeoMap, jsonWorld) => {
        if (errGeoMap) {
          throw errGeoMap;
        }
        this.map = new GeoMap(this, this.options.map, jsonWorld);

        this.buildComponenents();
      });
    } else {
      this.buildComponenents();
    }
  }

  buildComponenents() {
    // Filters
    if (this.options.filters) {
      this.filters = new Filters(this, this.options.filters);
    }

    // Table
    if (this.options.table) {
      this.table = new Table(this, this.options.table);
    }

    // Render
    this.render();

    // Restore state
    this.restoreState();
    window.addEventListener('hashchange', () => {
      this.restoreState();
    });
  }

  /**
   * Restore state for filters or/and map zooming
   */
  restoreState() {
    if (this.filters) this.filters.restoreState();
    if (this.map) this.map.restoreState();
  }

  render() {
    if (this.filters) {
      this.filters.filterData();
      this.filters.refresh();
    }

    if (this.map) {
      this.map.render();
    }

    if (this.table) {
      this.table.render();
    }

    // On complete
    if (this.options.onComplete && this.options.onComplete.constructor === Function) {
      this.options.onComplete.bind(this.maptable)();
    }
  }

  setColumnDetails() {
    const that = this;
    if (that.rawData.length === 0) {
      return;
    }
    const defaultColumns = {};

    Object.keys(that.rawData[0]).forEach(k => {
      const patternNumber = /^\d+$/;
      const isNumber = (patternNumber.test(that.rawData[0][k]));
      defaultColumns[k] = {
        title: utils.keyToTile(k),
        filterMethod: (isNumber) ? 'compare' : 'field',
        filterInputType: (isNumber) ? 'number' : 'text',
        sorting: true,
      };
      if (isNumber) {
        defaultColumns[k].dataParse = (val) => parseInt(val, 10);
      }
    });
    that.columnDetails = utils.extendRecursive(defaultColumns, this.options.columns);

    // add isVirtual to columns details
    Object.keys(that.columnDetails).forEach(k => {
      that.columnDetails[k].isVirtual = (typeof (that.columnDetails[k].virtual) === 'function');
    });
  }
}

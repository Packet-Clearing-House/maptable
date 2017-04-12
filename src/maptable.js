import utils from './utils';

import GeoMap from './components/GeoMap';
import Filters from './components/Filters';
import Table from './components/Table';

export default class MapTable {
  constructor(target, options) {
    this.options = options;

    this.state = {
      filters: {},
      zoom: {},
    };
    this.saveStateTimeout = {};

    this.node = document.querySelector(target);
    this.node.setAttribute('style', 'position:relative;');

    if (this.options.data.type === 'json') {
      d3.json(this.options.data.path, this.loadData.bind(this));
    } else if (this.options.data.type === 'csv') {
      d3.csv(this.options.data.path, this.loadData.bind(this));
    } else if (this.options.data.type === 'tsv') {
      d3.tsv(this.options.data.path, this.loadData.bind(this));
    }

    if (this.options.map && this.options.map.heatmap) {
      delete this.options.map.countries;
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

    if (this.options.data.preFilter) {
      this.rawData = this.rawData.filter(this.options.data.preFilter);
    }

    this.setColumnDetails();
    this.data = this.rawData.slice(); // we clone data, so that we can filter it
    // Map
    if (this.options.map) {
      // Map wrapper
      const mapWrapper = document.createElement('div');
      mapWrapper.setAttribute('class', 'mt-map-container');
      mapWrapper.innerHTML = '<div class="mt-loading">Loading...</div>';
      this.node.insertBefore(mapWrapper, this.node.firstChild);
      mapWrapper.querySelector('.mt-loading').style.display = 'block';
      d3.json(this.options.map.path, (errGeoMap, jsonWorld) => {
        if (errGeoMap) {
          throw errGeoMap;
        }
        this.map = new GeoMap(this, this.options.map, jsonWorld);

        mapWrapper.querySelector('.mt-loading').style.display = 'none';

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
    if (this.map) this.map.restoreState();
    if (this.filters) this.filters.restoreState();
  }


  /**
   * Save the state into the URL hash
   * @param stateName: name of the state (either filters or zoom)
   * @param stateData: object, contain state information
   */
  saveState(stateName, stateData) {
    window.clearTimeout(this.saveStateTimeout[stateName]);
    this.saveStateTimeout[stateName] = window.setTimeout(() => {
      this.state[stateName] = stateData;
      const newUrl = document.location.href.split('#')[0];
      let stateHash = '';
      ['filters', 'zoom'].forEach((f) => {
        if (Object.keys(this.state[f]).length) {
          stateHash += `!mt-${f}=${encodeURIComponent(JSON.stringify(this.state[f]))}`;
        }
      });
      if (stateHash !== '') stateHash = `#${stateHash}`;
      window.history.pushState(null, null, `${newUrl}${stateHash}`);
    }, 200);
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
      const patternNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
      const isNumber = (patternNumber.test(that.rawData[0][k]));
      defaultColumns[k] = {
        title: utils.keyToTile(k),
        filterMethod: (isNumber) ? 'compare' : 'field',
        filterInputType: (isNumber) ? 'number' : 'text',
        sorting: true,
      };
      if (isNumber) {
        defaultColumns[k].dataParse = (val) => parseFloat(val);
      }
    });
    that.columnDetails = utils.extendRecursive(defaultColumns, this.options.columns);

    // add isVirtual to columns details
    Object.keys(that.columnDetails).forEach(k => {
      that.columnDetails[k].isVirtual = (typeof (that.columnDetails[k].virtual) === 'function');
    });
  }
}

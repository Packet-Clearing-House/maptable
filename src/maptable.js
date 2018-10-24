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
      const isIE = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0);
      if (this.options.map.heatmap && isIE) {
        mapWrapper.innerHTML = '<div class="mt-loading">The heatmap feature is not supported with Internet Explorer.<br>Please use another modern browser to see this map.</div>';
        this.node.insertBefore(mapWrapper, this.node.firstChild);
        mapWrapper.querySelector('.mt-loading').style.display = 'block';
        this.options.map = false;
        this.buildComponenents();
        return;
      }
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

    // Restore state
    this.restoreState();
    window.addEventListener('hashchange', () => {
      this.restoreState();
    });

    // Render
    this.render();
  }

  /**
   * Restore state for filters or/and map zooming
   */
  restoreState() {
    // JSON state
    ['filters', 'zoom'].forEach((k) => {
      const v = this.parseState(k);
      if (!v) return;
      try {
        const parsedState = JSON.parse(v);
        this.state[k] = parsedState;
      } catch (e) {
        console.log(`Maptable: Invalid URL State for mt-${k} ${e.message}`);
      }
    });

    // string state
    ['sort'].forEach((k) => {
      const v = this.parseState(k);
      if (v) this.state[k] = v;
    });

    if (this.map) this.map.restoreState(this.state.zoom);
    if (this.table) this.table.restoreState(this.state.sort);
    if (this.filters) this.filters.restoreState(this.state.filters);
  }

  /**
   * Extract state from the url
   */
  parseState(key) {
    const params = document.location.href.replace(/%21mt/g, '!mt').split(`!mt-${key}=`);
    return (params[1]) ? decodeURIComponent(params[1].split('!mt')[0]) : null;
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
      ['filters', 'zoom'].forEach((k) => {
        if (Object.keys(this.state[k]).length) {
          stateHash += `!mt-${k}=${encodeURIComponent(JSON.stringify(this.state[k]))}`;
        }
      });
      ['sort'].forEach((k) => {
        if (this.state[k]) stateHash += `!mt-${k}=${this.state[k]}`;
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
    if (!this.firstExecution
      && this.options.onComplete
      && this.options.onComplete.constructor === Function
    ) {
      this.options.onComplete.bind(this)();
      this.firstExecution = true;
    }
  }

  setColumnDetails() {
    const that = this;
    if (that.rawData.length === 0) {
      return;
    }
    const defaultColumns = {};

    Object.keys(that.rawData[0]).forEach((k) => {
      const patternNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
      const isNumber = (patternNumber.test(that.rawData[0][k]));
      defaultColumns[k] = {
        title: utils.keyToTile(k),
        filterMethod: (isNumber) ? 'compare' : 'field',
        filterInputType: (isNumber) ? 'number' : 'text',
        sorting: true,
      };
      if (isNumber) {
        defaultColumns[k].dataParse = val => parseFloat(val);
      }
    });
    that.columnDetails = utils.extendRecursive(defaultColumns, this.options.columns);

    // add isVirtual to columns details
    Object.keys(that.columnDetails).forEach((k) => {
      that.columnDetails[k].isVirtual = (typeof (that.columnDetails[k].virtual) === 'function');
    });
  }
}

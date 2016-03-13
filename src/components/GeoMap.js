import Legend from './Legend';
import Watermark from './Watermark';

// Used the name GeoMap instead of Map to avoid collision with the native Map class of JS
export default class GeoMap {
  constructor(maptable, options, jsonWorld) {
    const that = this;
    this.maptable = maptable;
    this.scale = 1;
    this.transX = 0;
    this.transY = 0;

    this.options = options;

    this.jsonWorld = jsonWorld;

    this.node = document.querySelector('#mt-map');
    if (!this.node) {
      this.node = document.createElement('div');
      this.node.setAttribute('class', 'mt-map');
      this.maptable.node.insertBefore(this.node, this.maptable.node.firstChild);
    }

    this.svg = d3.select(this.node)
      .append('svg')
      .attr('viewBox', `0 0 ${this.getWidth()} ${this.getHeight()}`)
      .attr('width', this.getWidth())
      .attr('height', this.getHeight());

    // Resize parent div
    d3.select(this.node)
      .attr('style', `height:${this.getHeight()}px`);

    this.projection = d3.geo.equirectangular()
      .translate([this.getWidth() / 2, this.getHeight() / (2 * this.options.scaleHeight)])
      .scale((this.getWidth() / 640) * 100)
      .rotate([-12, 0])
      .precision(0.1);

    // Add coordinates to rawData
    this.maptable.rawData.forEach(d => {
      d.longitude = parseFloat(d[that.options.longitudeKey]);
      d.latitude = parseFloat(d[that.options.latitudeKey]);
      const coord = that.projection([d.longitude, d.latitude]);
      d.x = coord[0];
      d.y = coord[1];
      return d;
    });

    this.zoomListener = d3.behavior
      .zoom()
      .scaleExtent(this.options.scaleZoom)
      .on('zoom', this.rescale.bind(this));

    // Attach Zoom event to map
    if (this.options.zoom) {
      this.svg = this.svg.call(this.zoomListener.bind(this));
    }

    // Add Watermark
    if (this.options.watermark) {
      this.watermark = new Watermark(this, this.options.watermark);
    }

    // Add Title
    if (this.options.title) {
      this.title = this.buildTitle();
    }

    // Add tooltip
    this.tooltipNode = d3.select(this.node)
      .append('div')
      .attr('class', `mt-map-tooltip ${this.options.tooltipClass}`)
      .style('display', 'none');

    this.layerGlobal = this.svg.append('g').attr('class', 'mt-map-global');
    this.layerCountries = this.layerGlobal.append('g').attr('class', 'mt-map-countries');
    this.layerMarkers = this.layerGlobal.append('g').attr('class', 'mt-map-markers');
    this.loadGeometries();
  }

  scaleAttributes() {
    return Math.pow(this.scale, 2 / 3);
  }

  getWidth() {
    if (this.options.width) {
      return this.options.width;
    }
    return this.node.offsetWidth;
  }

  getHeight() {
    const deltaHeight = (this.options.title) ? 30 : 0;
    if (!this.options.height && this.options.ratioFromWidth) {
      return this.getWidth() * this.options.ratioFromWidth * this.options.scaleHeight + deltaHeight;
    }
    return this.options.height * this.options.scaleHeight + deltaHeight;
  }

  loadGeometries() {
    const dataGeometries = topojson.feature(this.jsonWorld,
      this.jsonWorld.objects.countries).features;

    // If we have data concerning that affect countries
    let dataCountries = [];
    let dataCountriesAssoc = {};
    if (this.options.countries.groupBy) {
      dataCountries = d3.nest()
      .key(this.options.countries.groupBy)
      .entries(this.maptable.data);

      dataCountriesAssoc = {};
      dataCountries.forEach(val => {
        dataCountriesAssoc[val.key] = dataCountries.values;
      });
    }
    // Put dataCountries into dataGeometries if available
    for (let i = 0; i < dataGeometries.length; i++) {
      dataGeometries[i].key = dataGeometries[i].id;
      dataGeometries[i].values = [];
    }

    // Create countries
    this.layerCountries.selectAll('.mt-map-country')
      .data(dataGeometries)
      .enter()
      .insert('path')
      .attr('class', 'mt-map-country')
      .attr('d', d3.geo.path().projection(this.projection));

    if (this.options.legend) {
      this.legendObject = new Legend(this);
    }
    // Countries
    this.updateCountries();

    // Markers
    this.updateMarkers();
  }

  fitContent() {
    if (this.maptable.data.length === 0) {
      this.transX = 0;
      this.transY = 0;
      this.scale = 1;
      this.zoomListener.translate([this.transX, this.transY])
        .scale(this.scale);
      return true;
    }
    const hor = d3.extent(this.maptable.data, d => d.x);
    const ver = d3.extent(this.maptable.data, d => d.y);

    // center dots with the good ratio
    const ratio = this.getWidth() / this.getHeight();
    const deltaMarker = 20;

    const currentWidth = (hor[1] - hor[0]) + deltaMarker;
    const currentHeight = (ver[1] - ver[0]) + deltaMarker;

    const realHeight = currentWidth / ratio;
    const realWidth = currentHeight * ratio;

    let diffMarginWidth = 0;
    let diffMarginHeight = 0;
    if (realWidth >= currentWidth) {
      diffMarginWidth = (realWidth - currentWidth) / 2;
    } else {
      diffMarginHeight = (realHeight - currentHeight) / 2;
    }

    // add layout margin
    hor[0] -= (this.options.fitContentMargin + diffMarginWidth);
    hor[1] += (this.options.fitContentMargin + diffMarginWidth);
    ver[0] -= (this.options.fitContentMargin + diffMarginHeight);
    ver[1] += (this.options.fitContentMargin + diffMarginHeight);

    this.scale = this.getWidth() / (hor[1] - hor[0]);
    this.transX = -1 * hor[0] * this.scale;
    this.transY = -1 * ver[0] * this.scale;

    this.zoomListener.translate([this.transX, this.transY]).scale(this.scale);
  }

  buildTitle() {
    const titleContainer = this.svg
      .append('svg')
      .attr('width', this.getWidth())
      .attr('x', 0)
      .attr('y', (this.getHeight() - 30))
      .attr('height', 30);

    if (this.options.title.bgColor) {
      titleContainer.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.getWidth())
        .attr('height', 30)
        .attr('fill', this.options.title.bgColor);
    }

    titleContainer.append('text')
      .attr('id', 'mt-map-title')
      .attr('x', 20)
      .attr('font-size', this.options.title.fontSize)
      .attr('font-family', this.options.title.fontFamily)
      .attr('y', 20);

    if (this.options.title.source) {
      titleContainer.append('text')
        .attr('y', 20)
        .attr('x', (this.getWidth() - 20))
        .attr('text-anchor', 'end')
        .attr('font-size', this.options.title.fontSize)
        .attr('font-family', this.options.title.fontFamily)
        .html(this.options.title.source());
    }
  }

  rescale() {
    const that = this;
    if (d3.event && d3.event.translate) {
      this.scale = d3.event.scale;
      this.transX = (this.scale === 1) ? 0 : d3.event.translate[0];
      this.transY = (this.scale === 1) ? 0 : d3.event.translate[1];
    }

    const maxTransX = 0;
    const maxTransY = 0;
    const minTransX = this.getWidth() * (1 - this.scale);
    const minTransY = this.getHeight() * (1 - this.scale);

    if (this.transY > maxTransY) {
      this.transY = maxTransY;
    } else if (this.transY < minTransY) {
      this.transY = minTransY;
    }

    if (this.transX > maxTransX) {
      this.transX = maxTransX;
    } else if (this.transX < minTransX) {
      this.transX = minTransX;
    }

    if (d3.event && d3.event.translate) {
      d3.event.translate[0] = this.transX;
      d3.event.translate[1] = this.transY;
    }

    this.layerGlobal.attr('transform',
      `translate(${this.transX}, ${this.transY})scale(${this.scale})`);

    // Hide tooltip
    that.tooltipNode.attr('style', 'display:none;');

    // Rescale markers size
    if (this.options.markers) {
      // markers
      d3.selectAll('.mt-map-marker').each(function (d) {
        // stroke
        if (d.prop['stroke-width']) {
          d3.select(this).attr('stroke-width', d.prop['stroke-width'] / that.scaleAttributes());
        }
        // radius
        if (d.prop.r) {
          d3.select(this).attr('r', d.prop.r / that.scaleAttributes());
        }
      });
    }

    // Rescale Country stroke-width
    d3.selectAll('.mt-map-country').each(function (d) {
      // stroke
      if (d.prop['stroke-width']) {
        d3.select(this).attr('stroke-width', d.prop['stroke-width'] / that.scaleAttributes());
      }
    });
  }

  getScaledValue(obj, key, datum, data) {
    if (!obj.rollup) {
      if (typeof (obj.attr[key]) === 'object') {
        throw new Error(`No rollup and property is an object: ${key}`);
      }
      return obj.attr[key];
    }
    if (obj.attr[key] instanceof Array) {
      const domain = d3.extent(data, d => obj.rollup(d.values));

      // We copy the variable instead of reference
      const range = obj.attr[key].slice(0);

      if (obj.attr[key][0] === 'min') {
        range[0] = domain[0];
      }
      if (obj.attr[key][1] === 'max') {
        range[1] = domain[1];
      }

      if (range.length === 3) {
        if (typeof (range[2]) === 'function') {
          range[0] = range[2](range[0]);
          range[1] = range[2](range[1]);
        } else if (typeof (range[2]) === 'number') {
          range[0] = range[0] * range[2];
          range[1] = range[1] * range[2];
        }
        range.pop();
      }
      // Dynamic value
      const scale = d3.scale.linear()
        .domain(domain)
        .range(range);

      const filteredData = data.filter(d => d.key === datum.key);

      if (!filteredData.length) {
        if (obj.attrEmpty && obj.attrEmpty[key]) {
          datum.value = 0;
          return obj.attrEmpty[key];
        }
        throw new Error(`attrEmpty[${key}] not found`);
      }
      datum.value = obj.rollup(filteredData[0].values);
      return scale(datum.value);
    }
    if (typeof (obj.attr[key]) === 'number' || typeof (obj.attr[key]) === 'string') {
      // Static value
      return obj.attr[key];
    }
    throw new Error(`Invalid value for ${key}`);
  }

  updateMarkers() {
    const defaultGroupBy = a => `${a.longitude},${a.latitude}`;
    const dataMarkers = d3.nest()
      .key(this.options.markers.groupBy ? this.options.markers.groupBy : defaultGroupBy)
      .entries(this.maptable.data)
      .filter(d => {
        return d.values[0].latitude !== 0;
      });

    const markerItem = this.layerMarkers
      .selectAll('.mt-map-marker')
      .data(dataMarkers);

    // Exit
    markerItem.exit().transition()
      .attr('r', 0)
      .attr('fill', '#eee')
      .style('opacity', 0)
      .remove();

    // Enter
    let markerObject = markerItem.enter();
    if (this.options.markers.customMarker) {
      markerObject = this.options.markers.customMarker(markerObject);
    } else {
      markerObject = markerObject.append('svg:circle');
    }
    const markerClassName = (this.options.markers.className) ?
      this.options.markers.className : '';

    markerObject.attr('class', `mt-map-marker ${markerClassName}`);

    const attrX = (this.options.markers.attrX) ? this.options.markers.attrX : 'cx';
    const attrY = (this.options.markers.attrY) ? this.options.markers.attrY : 'cy';

    const attrXDelta = (this.options.markers.attrXDelta) ? this.options.markers.attrXDelta : 0;
    const attrYDelta = (this.options.markers.attrYDelta) ? this.options.markers.attrYDelta : 0;

    // Update
    let markerUpdate = markerItem
      .attr(attrX, d => d.values[0].x + attrXDelta)
      .attr(attrY, d => d.values[0].y + attrYDelta);

    if (this.options.markers.attr) {
      Object.keys(this.options.markers.attr).forEach(key => {
        markerUpdate = markerUpdate.attr(key, datum => {
          if (!datum.prop) datum.prop = {};
          datum.prop[key] = this.getScaledValue(this.options.markers, key, datum, dataMarkers);
          return datum.prop[key];
        });
      });
    }

    if (this.options.markers.tooltip) {
      this.activateTooltip(markerUpdate, this.options.markers.tooltip);
    }
  }

  updateCountries() {
    const that = this;
    if (this.options.countries.attr) {
      let dataCountries = [];
      const dataCountriesAssoc = {};
      if (this.options.countries.groupBy) {
        dataCountries = d3.nest()
          .key(this.options.countries.groupBy)
          .entries(this.maptable.data);
        for (let i = 0; i < dataCountries.length; i++) {
          dataCountriesAssoc[dataCountries[i].key] = dataCountries[i].values;
        }
      }

      if (this.legendObject) {
        const domain = d3.extent(dataCountries, d => this.options.countries.rollup(d.values));
        this.legendObject.updateExtents(domain);
      }

      const countryItem = d3.selectAll('.mt-map-country')
        .each(function (datum) {
          Object.keys(that.options.countries.attr).forEach(key => {
            d3.select(this).attr(key, () => {
              if (!datum.prop) datum.prop = {};
              datum.prop[key] = that.getScaledValue(that.options.countries, key,
                 datum, dataCountries);
              return datum.prop[key];
            });
          });
        });

      if (this.legendObject) {
        countryItem.on('mouseover', (datum) => this.legendObject.indiceChange(datum.value))
        .on('mouseout', () => this.legendObject.indiceChange(NaN));
      }

      if (this.options.countries.tooltip) {
        this.activateTooltip(countryItem, this.options.countries.tooltip);
      }
    }
  }

  activateTooltip(target, tooltipContent, cb) {
    target.on('mousemove', d => {
      const mousePosition = d3.mouse(this.svg.node()).map(v => parseInt(v, 10));
      this.tooltipNode.attr('style', 'display:block;').html(tooltipContent(d));
      const tooltipDelta = this.tooltipNode.node().offsetWidth / 2;
      const mouseLeft = (mousePosition[0] - tooltipDelta +
        document.getElementById('mt-map').offsetLeft);
      const mouseTop = (mousePosition[1] + 10 + document.getElementById('mt-map').offsetTop);
      this.tooltipNode.attr('style', `top:${mouseTop}px;left:${mouseLeft}px;display:block;`)
        .on('mouseout', () => this.tooltipNode.style('display', 'none'));

      if (cb) {
        this.tooltipNode.on('click', cb);
      }
    });
  }
}

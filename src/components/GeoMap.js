import Legend from './Legend';
import Watermark from './Watermark';
import StackBlur from './StackBlur';
import utils from '../utils';
import { solarPosition, antipode } from './solarPosition';

/**
 * Used the name GeoMap instead of Map to avoid collision with the native Map class of JS
 */
export default class GeoMap {
  /**
   * Geo Mapping class constructor that will initiate the map drawing
   * @param maptable: Maptable main Object
   * @param options: options communicated to map
   * @param jsonWorld: Object that contain TopoJSON dataset
   */
  constructor(maptable, options, jsonWorld) {
    this.maptable = maptable;
    this.scale = 1;
    this.transX = 0;
    this.transY = 0;

    this.options = options;

    this.jsonWorld = jsonWorld;

    this.containerSelector = maptable.options.target;
    this.container = document.querySelector(maptable.options.target);

    // Map wrapper
    const mapWrapper = this.container.querySelector('.mt-map-container');

    const existingMap = this.container.querySelector('#mt-map');
    if (existingMap) {
      // transform #mt-map to .mt-map-container'
      mapWrapper.parentNode.insertBefore(mapWrapper, existingMap);
      existingMap.parentNode.removeChild(existingMap);
    }

    // Map
    this.node = document.createElement('div');
    this.node.setAttribute('id', 'mt-map');
    mapWrapper.appendChild(this.node);

    this.svg = d3.select(this.node)
      .append('svg')
      .attr('id', 'mt-map-svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('viewBox', `0 0 ${this.getWidth()} ${this.getHeight()}`)
      .attr('width', this.getWidth())
      .attr('height', this.getHeight());

    this.projection = d3.geo.equirectangular()
      .translate([this.getWidth() / 2, this.getHeight() / (2 * this.options.scaleHeight)])
      .scale((this.getWidth() / 640) * 100)
      .rotate([-12, 0])
      .precision(0.1);

    this.path = d3.geo.path().projection(this.projection);

    this.enrichData();

    this.zoomListener = d3.behavior
      .zoom()
      .scaleExtent(this.options.scaleZoom)
      .on('zoom', this.rescale.bind(this));

    // Attach Zoom event to map
    if (this.options.zoom) {
      this.svg = this.svg.call(this.zoomListener.bind(this));
    }

    // Add tooltip
    if (this.options.markers) {
      this.tooltipMarkersNode = d3.select(this.node)
        .append('div')
        .attr('id', 'mt-map-markers-tooltip')
        .attr('class', `mt-map-tooltip ${this.options.markers.tooltipClassName}`)
        .style('display', 'none');
    }

    if (this.options.countries) {
      this.tooltipCountriesNode = d3.select(this.node)
        .append('div')
        .attr('id', 'mt-map-countries-tooltip')
        .attr('class', `mt-map-tooltip ${this.options.countries.tooltipClassName}`)
        .style('display', 'none');
    }

    this.layerGlobal = this.svg.append('g').attr('class', 'mt-map-global');
    this.layerDefs = this.svg.append('defs');
    this.layerDefs.html(`
    <filter id="blur"><feGaussianBlur stdDeviation="18" /></filter>
    <radialGradient id="sunGradient">
        <stop offset="0" stop-color="#FFC000" stop-opacity="0.5" />
        <stop offset="0.45" stop-color="#FFC000" stop-opacity="0.15" />
        <stop offset="1" stop-color="#FFC000" stop-opacity="0" />
      </radialGradient>
    `);
    if (this.options.timezones) this.layerTimezones = this.layerGlobal.append('g').attr('class', 'mt-map-timezones');
    this.layerCountries = this.layerGlobal.append('g').attr('class', 'mt-map-countries');
    if (this.options.night) this.layerNight = this.layerGlobal.append('g').attr('class', 'mt-map-night');

    if (this.options.heatmap) this.layerHeatmap = this.layerGlobal.append('g').attr('class', 'mt-map-heatmap');
    this.layerMarkers = this.layerGlobal.append('g').attr('class', 'mt-map-markers');

    // Add Watermark
    if (this.options.watermark) {
      this.watermark = new Watermark(this, this.options.watermark);
    }

    // Add Title
    if (this.options.title) {
      this.buildTitle();
    }

    // Add Export SVG Capability
    if (this.options.exportSvgClient || this.options.exportSvg) {
      this.addExportSvgCapability();
    }

    // AutoResize
    if (!this.options.width) {
      window.addEventListener('resize', () => {
        this.svg.attr('width', this.getWidth());
        this.svg.attr('height', this.getHeight());
        this.rescale();
      });
    }

    // Let's build things
    this.loadGeometries();

    // render is triggered by MapTable
    // this.render();
  }

  enrichData() {
    // Add coordinates to rawData
    this.maptable.rawData.forEach((d) => {
      d.longitude = parseFloat(d[this.options.longitudeKey]);
      d.latitude = parseFloat(d[this.options.latitudeKey]);
      let coord = [0, 0];
      if (!Number.isNaN(d.longitude) && !Number.isNaN(d.latitude)) {
        coord = this.projection([d.longitude, d.latitude]);
      }
      d.x = coord[0];
      d.y = coord[1];
    });
  }

  scaleAttributes() {
    return Math.pow(this.scale, 2 / 3); // eslint-disable-line
  }

  getWidth() {
    if (this.options.width) {
      return this.options.width;
    }
    this.options.width = this.node.offsetWidth;
    return this.node.offsetWidth;
  }

  getHeight() {
    const deltaHeight = (this.options.title) ? 30 : 0;
    if (!this.options.height && this.options.ratioFromWidth) {
      return this.getWidth() * this.options.ratioFromWidth * this.options.scaleHeight + deltaHeight;
    }
    return this.options.height * this.options.scaleHeight + deltaHeight;
  }

  /**
   * Load geometries and built the map components
   */
  loadGeometries() {
    // We filter world data
    if (this.options.filterCountries) {
      this.jsonWorld.objects.countries.geometries = this.jsonWorld.objects.countries
        .geometries.filter(this.options.filterCountries);
    }

    // Build countries
    if (this.options.countries) this.buildCountries();

    // Build heatmap
    if (this.options.heatmap) this.buildHeatmap();

    if (this.options.night) this.buildNight();
    if (
      this.options.timezones
      && (this.options.timezones.path || this.options.timezones.pathData)
    ) this.buildTimezone();
  }

  /**
   * Logic to build the heatmap elements (without the filling the heatmap image)
   */
  buildHeatmap() {
    // Build vectors
    const lands = topojson.merge(this.jsonWorld, this.jsonWorld.objects.countries.geometries);
    if (!this.options.heatmap.disableMask) {
      this.maskHeatmap = this.layerHeatmap.append('defs')
        .append('clipPath')
        .attr('id', 'mt-map-heatmap-mask');

      this.maskHeatmap
        .datum(lands)
        .append('path')
        .attr('class', 'mt-map-heatmap-mask-paths')
        .attr('d', this.path);
    }

    this.imgHeatmap = this.layerHeatmap
      .append('image')
      .attr('width', this.getWidth())
      .attr('height', this.getHeight())
      .attr('x', 0)
      .attr('y', 0)
      .attr('class', 'mt-map-heatmap-img');

    if (this.options.heatmap.mask) {
      this.imgHeatmap = this.imgHeatmap.attr('clip-path', 'url(#mt-map-heatmap-mask)');
    }

    if (this.options.heatmap.borders) {
      const borders = topojson.mesh(
        this.jsonWorld,
        this.jsonWorld.objects.countries,
        (a, b) => a !== b,
      );

      this.bordersHeatmap = this.layerHeatmap
        .append('g')
        .attr('class', 'mt-map-heatmap-borders');

      this.bordersHeatmap.selectAll('path.mt-map-heatmap-borders-paths')
        .data([lands, borders])
        .enter()
        .append('path')
        .attr('class', 'mt-map-heatmap-borders-paths')
        .attr('fill', 'none')
        .attr('stroke-width', this.options.heatmap.borders.stroke)
        .attr('stroke', this.options.heatmap.borders.color)
        .attr('style', `opacity: ${this.options.heatmap.borders.opacity}`)
        .attr('d', this.path);
    }
  }

  /**
   * Logic to build the night position
   */
  buildNight() {
    this.layerNight = this.layerGlobal.append('g')
      .attr('class', 'mt-map-night')
      .attr('transform', 'translate(0,0)');

    const circle = d3.geo.circle()
      .angle(90);

    // Mask night
    this.maskNight = this.layerNight.append('defs')
      .append('clipPath')
      .attr('id', 'mt-map-night-mask');

    this.maskNight.append('rect')
      .attr('x', 0)
      .attr('y', 30)
      .attr('width', this.getWidth())
      .attr('height', this.getHeight() * 0.82 - 30);

    // Build vectors
    this.nightPath = this.layerNight.append('path')
      .attr('class', 'mt-map-night-layer')
      .attr('filter', 'url(#blur)')
      .attr('clip-path', 'url(#mt-map-night-mask)')
      .attr('d', this.path)
      .style('opacity', 0.1);

    const userDate = this.options.night.date || Date.UTC();
    const startOfDay = Date.UTC(
      userDate.getUTCFullYear(),
      userDate.getUTCMonth(),
      userDate.getUTCDate(),
      0,
      0,
      0,
    );
    const solarPositionDated = solarPosition(new Date(startOfDay));
    this.nightPath.datum(circle.origin(antipode(solarPositionDated))).attr('d', this.path);

    if (this.options.night.allowLeftRightNights) {
      this.nightPathRight = this.layerNight.append('path')
        .attr('class', 'mt-map-night-layer-right')
        .attr('filter', 'url(#blur)')
        .attr('clip-path', 'url(#mt-map-night-mask)')
        .attr('d', this.nightPath.attr('d'))
        .style('opacity', 0.1)
        .attr('transform', `translate(${this.getWidth()},0)`);

      this.nightPathLeft = this.layerNight.append('path')
        .attr('class', 'mt-map-night-layer-left')
        .attr('filter', 'url(#blur)')
        .attr('clip-path', 'url(#mt-map-night-mask)')
        .attr('d', this.nightPath.attr('d'))
        .style('opacity', 0.1)
        .attr('transform', `translate(${-this.getWidth()},0)`);
    }

    if (!this.options.night.disableSun) {
      const sunCoords = this.projection(solarPositionDated);

      this.sunCircleRight = this.layerNight.append('svg:circle')
        .attr('class', 'mt-map-sun-right')
        .attr('cx', sunCoords[0])
        .attr('cy', sunCoords[1])
        .attr('fill', 'url(#sunGradient)')
        .attr('r', this.getHeight() * 0.35);

      this.sunCircleXRight = this.layerNight.append('svg:circle')
        .attr('class', 'mt-map-sun-xright')
        .attr('cx', sunCoords[0] + this.getWidth())
        .attr('cy', sunCoords[1])
        .attr('fill', 'url(#sunGradient)')
        .attr('r', this.getHeight() * 0.35);

      this.sunCircleLeft = this.layerNight.append('svg:circle')
        .attr('class', 'mt-map-sun-right')
        .attr('cx', sunCoords[0] - this.getWidth())
        .attr('cy', sunCoords[1])
        .attr('fill', 'url(#sunGradient)')
        .attr('r', this.getHeight() * 0.35);

      this.sunCircleXLeft = this.layerNight.append('svg:circle')
        .attr('class', 'mt-map-sun-xright')
        .attr('cx', sunCoords[0] - 2 * this.getWidth())
        .attr('cy', sunCoords[1])
        .attr('fill', 'url(#sunGradient)')
        .attr('r', this.getHeight() * 0.35);
    }
  }

  /**
   * Logic to build the timezone strips
   */
  buildTimezone() {
    if (this.options.timezones.pathData) {
      this.loadTimezone(null, JSON.parse(this.options.timezones.pathData));
    } else if (this.options.timezones.path) {
      d3.json(this.options.timezones.path, (errGeoMap, jsonTimezones) => {
        this.loadTimezone(errGeoMap, jsonTimezones);
      });
    }
  }

  loadTimezone(err, jsonTimezones) {
    this.dataTimezones = topojson.feature(
      jsonTimezones,
      jsonTimezones.objects.timezones,
    ).features;

    // Mask timezone
    this.maskTimezone = this.layerTimezones.append('defs')
      .append('clipPath')
      .attr('id', 'mt-map-timezone-mask');

    this.maskTimezone.append('rect')
      .attr('x', 0)
      .attr('y', 30)
      .attr('width', this.getWidth())
      .attr('height', this.getHeight() * 0.82 - 30);

    // Build timezone paths
    this.layerTimezones
      .selectAll('.mt-map-timezone')
      .data(this.dataTimezones.filter((d) => d.properties.places !== 'Antarctica'))
      .enter()
      .insert('path')
      .attr('class', 'mt-map-timezone')
      .attr('d', this.path)
      .attr('fill', (d) => (d.properties.zone % 2 === 0 ? '#F4F5F5' : 'transparent'))
      .attr('title', (d) => JSON.stringify(d.properties))
      .attr('clip-path', 'url(#mt-map-timezone-mask)')
      .style('opacity', 0.6);

    // Add times
    const timezoneTexts = this.dataTimezones.filter((d) => d.properties.places !== 'Antarctica' && d.properties.zone % 1 === 0 && d.properties.zone !== 14);
    const timezoneTextsUnique = [...new Map(timezoneTexts.map((item) => (
      [item.properties.zone, item]
    ))).values()];

    this.layerTimezonesText = this.layerTimezones.append('g').attr('class', 'mt-map-timezones-texts');
    this.layerTimezonesText.selectAll('.mt-map-timezone-text')
      .data(timezoneTextsUnique)
      .enter()
      .insert('text')
      .attr('class', 'mt-map-timezone-text')
      .attr('y', this.getHeight() * 0.82 - 5)
      .attr('x', (d) => (d.properties.zone + 10) * (this.getWidth() / 24.5) - 1)
      .attr('dx', (this.getWidth() / 24.5) / 2)
      .attr('font-size', 9)
      .attr('font-family', 'Helevetica, Arial, Sans-Serif')
      .attr('fill', '#999')
      .attr('text-anchor', 'middle')
      .html((d) => (
        utils.formatDate((this.options.timezones.date || new Date()), d.properties.zone)));
  }

  /**
   * Get Scale for every circle magnitude
   * @param heatmapDataset: heatmap dataset that we use
   * @returns scale: function - Scale function that output a value [0 - 1]
   */
  getMagnitudeScale(heatmapDataset) {
    const opts = this.options.heatmap;
    const lengthDataset = heatmapDataset.length;
    if (!lengthDataset) return () => 0;
    // const layersPerLocation = (opts.circles.max - opts.circles.min) / opts.circles.step;
    const maxOpacityScale = d3.scale.linear()
      .domain([1, lengthDataset])
      .range([1, 0.25]);
    const centralCircleOpacity = maxOpacityScale(lengthDataset);

    const scale = d3.scale.linear()
      .domain([opts.circles.min, 20])
      .range([centralCircleOpacity, 0]);
    return (m) => scale(m);
  }

  /**
   * Get Scale for every data point (used for weighting)
   * @returns scale: function - Scale function that output a value [0 - 1]
   */
  getDatumScale() {
    if (!this.options.heatmap.weightByAttribute) return () => 1;
    const dataExtents = d3.extent(this.maptable.data, this.options.heatmap.weightByAttribute);
    const userScale = (this.options.heatmap.weightByAttributeScale === 'log')
      ? d3.scale.log : d3.scale.linear;
    const scale = userScale().domain(dataExtents).range([0.5, 1]);
    return (d) => {
      const val = this.options.heatmap.weightByAttribute(d);
      if (!val) return 0;
      return scale(val);
    };
  }

  /**
   * Get the Data URL of the heatmap image
   * @returns {string} base64 image
   */
  getHeatmapData() {
    const canvasHeatmap = d3.select(this.node)
      .append('canvas')
      .attr('id', 'mt-map-heatmap-canvas')
      .attr('width', this.getWidth())
      .attr('height', this.getHeight())
      .attr('style', 'display: none;');

    const ctx = canvasHeatmap.node().getContext('2d');
    ctx.globalCompositeOperation = 'multiply';
    const circles = d3.range(
      this.options.heatmap.circles.min,
      this.options.heatmap.circles.max,
      this.options.heatmap.circles.step,
    );
    const datumScale = this.getDatumScale();
    const heatmapDataset = this.maptable.data.filter((d) => datumScale(d) > 0.1);
    const path = this.path.context(ctx);
    const magnitudeScale = this.getMagnitudeScale(heatmapDataset);
    const colorScale = d3.scale.linear()
      .domain([1, 0])
      .range(['#000000', '#FFFFFF']);

    // Make a flat white background first
    ctx.beginPath();
    ctx.rect(0, 0, this.getWidth(), this.getHeight());
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();

    // color strenght factor
    const colorMultiplier = (x) => {
      const a = this.options.heatmap.circles.colorStrength;
      const aa = 1 + ((a - 1) / 100);
      if (a > 1) return (2 - aa) * x + aa - 1;
      return a * x;
    };

    // add condensed clouds
    heatmapDataset.forEach((point) => {
      const scaleOpacityDatum = datumScale(point);
      circles.forEach((m) => {
        const opacity = colorMultiplier(magnitudeScale(m) * scaleOpacityDatum);
        if (opacity > 0) {
          ctx.beginPath();
          path(d3.geo.circle().origin([point.longitude, point.latitude]).angle(m - 0.0001)());
          ctx.fillStyle = colorScale(opacity);
          ctx.fill();
          ctx.closePath();
        }
      });
    });

    StackBlur.canvasRGBA(
      canvasHeatmap.node(),
      0,
      0,
      this.getWidth(),
      this.getHeight(),
      this.options.heatmap.circles.blur,
    );

    // Add color layer
    ctx.beginPath();
    ctx.globalCompositeOperation = 'screen';
    ctx.rect(0, 0, this.getWidth(), this.getHeight());
    ctx.fillStyle = this.options.heatmap.circles.color;
    ctx.fill();
    ctx.closePath();

    const dataUrl = canvasHeatmap.node().toDataURL();
    canvasHeatmap.remove();
    return dataUrl;
  }

  /**
   * Set the data URL to the heatmap image
   */
  updateHeatmap() {
    const dataUrl = this.getHeatmapData();
    this.imgHeatmap.attr('xlink:href', dataUrl);
  }

  /**
   * build the paths for the countries
   */
  buildCountries() {
    this.dataCountries = topojson.feature(
      this.jsonWorld,
      this.jsonWorld.objects.countries,
    ).features;

    // Build country paths
    this.layerCountries
      .selectAll('.mt-map-country')
      .data(this.dataCountries)
      .enter()
      .insert('path')
      .attr('class', 'mt-map-country')
      .attr('d', this.path);

    // Build Country Legend
    this.legendCountry = {};

    if (this.shouldRenderLegend()) {
      this.legendCountry.fill = new Legend(this);
    }
  }

  shouldRenderLegend() {
    const f = this.options.countries.attr.fill;
    if (!f) return false;
    if (!f.legend || !f.min || !f.max) return false;
    if (f.aggregate && f.aggregate.scale) {
      const scale = (typeof (f.aggregate.scale) === 'function')
        ? f.aggregate.scale.bind(this.maptable)()
        : f.aggregate.scale;
      if (scale !== 'linear') return false;
    }
    return true;
  }

  /**
   * Get all mt-map-country elements
   */
  getAllMtMapCountry() {
    if (this.allMtMapCountry) return this.allMtMapCountry;
    this.allMtMapCountry = d3.selectAll(`${this.containerSelector} .mt-map-country`);
    return this.allMtMapCountry;
  }

  /**
   * Get all mt-map-marjker elements
   */
  getAllMtMapMarker() {
    if (this.allMtMapMarker) return this.allMtMapMarker;
    this.allMtMapMarker = d3.selectAll(`${this.containerSelector} .mt-map-marker`);
    return this.allMtMapMarker;
  }

  /**
   * Set the right color for every country
   */
  updateCountries() {
    // Data from user input
    const dataByCountry = new Map();
    this.maptable.data.forEach((d) => {
      const key = d[this.options.countryIdentifierKey];
      if (!dataByCountry.has(key)) {
        dataByCountry.set(key, []);
      }
      dataByCountry.get(key).push(d);
    });

    // We merge both data
    this.dataCountries.forEach((geoDatum) => {
      geoDatum.key = geoDatum.properties[this.options.countryIdentifierType];
      const matchedCountry = dataByCountry.get(geoDatum.key);
      geoDatum.values = matchedCountry || [];
      geoDatum.attr = {};
      geoDatum.rollupValue = {};
    });

    // We calculate attributes values
    Object.keys(this.options.countries.attr).forEach((k) => {
      this.setAttrValues(k, this.options.countries.attr[k], this.dataCountries);
    });

    // Update SVG
    const countryItem = this.getAllMtMapCountry().each(function (d) {
      const selection = d3.select(this);
      Object.keys(d.attr).forEach((key) => {
        selection.attr(key, d.attr[key]);
      });
    });

    // Update Legend
    Object.keys(this.options.countries.attr).forEach((attrKey) => {
      const attrValue = this.options.countries.attr[attrKey];
      if (typeof (attrValue) === 'object' && attrValue.legend && this.legendCountry[attrKey] !== undefined) {
        const scaleDomain = d3.extent(
          this.dataCountries,
          (d) => Number(d.attrProperties[attrKey].value),
        );
        this.legendCountry[attrKey].updateExtents(scaleDomain);

        // When we mouseover the legend, it should highlight the indice selected
        countryItem.on('mouseover', (d) => {
          this.legendCountry[attrKey].indiceChange(d.attrProperties[attrKey].value);
        })
          .on('mouseout', () => {
            this.legendCountry[attrKey].indiceChange(NaN);
          });
      }
    });

    // Update Tooltip
    if (this.options.countries && this.options.countries.tooltip) {
      this.activateTooltip(
        countryItem,
        this.tooltipCountriesNode,
        this.options.countries.tooltip,
        true,
      );
    }
  }

  /**
   * Update night drawings
   */
  updateNight() {
    const userDate = this.options.night.date || Date.UTC();
    const startOfDay = Date.UTC(
      userDate.getUTCFullYear(),
      userDate.getUTCMonth(),
      userDate.getUTCDate(),
      0,
      0,
      0,
    );
    const endOfDay = Date.UTC(
      userDate.getUTCFullYear(),
      userDate.getUTCMonth(),
      userDate.getUTCDate(),
      23,
      59,
      59,
    );

    const totalMilliseconds = endOfDay - startOfDay;
    const currentTime = userDate - startOfDay;
    const relativeTranslateX = (currentTime / totalMilliseconds);
    console.log(relativeTranslateX);

    this.layerNight.attr('transform', `translate(${this.getWidth() * relativeTranslateX},0)`);
  }

  /**
   * Update night drawings
   */
  updateTimezones() {
    const timezoneTexts = document.querySelectorAll('.mt-map-timezone-text');
    const currentDate = this.options.timezones.date || new Date();

    Array.from(timezoneTexts).forEach((timezoneText) => {
      timezoneText.textContent = utils.formatDate(
        currentDate,
        timezoneText.__data__.properties.zone,
      );
    });
  }

  updateMarkers() {
    const defaultGroupBy = (a) => `${a.longitude},${a.latitude}`;

    this.dataMarkers = d3.nest()
      .key(defaultGroupBy)
      .entries(this.maptable.data)
      .filter((d) => d.values[0].x !== 0);

    // We merge both data
    this.dataMarkers.forEach((d) => {
      d.attr = {};
      d.attrProperties = {};
    });

    // We calculate attributes values
    Object.keys(this.options.markers.attr).forEach((k) => {
      this.setAttrValues(k, this.options.markers.attr[k], this.dataMarkers);
    });

    // Enter
    const markerItem = this.layerMarkers
      .selectAll('.mt-map-marker')
      .data(this.dataMarkers);
    let markerObject = markerItem.enter();
    if (this.options.markers.customTag) {
      markerObject = this.options.markers.customTag(markerObject);
    } else {
      markerObject = markerObject.append('svg:circle');
    }
    const markerClassName = (this.options.markers.className)
      ? this.options.markers.className : '';

    markerObject.attr('class', `mt-map-marker ${markerClassName}`);

    // Exit
    markerItem.exit().transition()
      .attr('r', 0)
      .attr('fill', '#eee')
      .style('opacity', 0)
      .remove();

    // Update
    const attrX = (this.options.markers.attrX) ? this.options.markers.attrX : 'cx';
    const attrY = (this.options.markers.attrY) ? this.options.markers.attrY : 'cy';

    const attrXDelta = (this.options.markers.attrXDelta) ? this.options.markers.attrXDelta : 0;
    const attrYDelta = (this.options.markers.attrYDelta) ? this.options.markers.attrYDelta : 0;

    const markerUpdate = markerItem
      .attr(attrX, (d) => d.values[0].x + attrXDelta)
      .attr(attrY, (d) => d.values[0].y + attrYDelta);

    this.getAllMtMapMarker().each(function (d) {
      Object.keys(d.attr).forEach((key) => {
        d3.select(this).attr(key, d.attr[key]);
      });
    });

    if (this.options.markers.tooltip) {
      this.activateTooltip(
        markerUpdate,
        this.tooltipMarkersNode,
        this.options.markers.tooltip,
        false,
      );
    }

    this.rescale();
  }

  fitContent() {
    if (this.maptable.data.length === 0) {
      this.transX = 0;
      this.transY = 0;
      this.scale = 1;
      this.zoomListener.translate([this.transX, this.transY])
        .scale(this.scale);
      return;
    }
    const hor = d3.extent(this.maptable.data, (d) => d.x);
    const ver = d3.extent(this.maptable.data, (d) => d.y);

    // center dots with the good ratio
    const ratio = this.getWidth() / this.getHeight();
    const deltaMarker = 20 + ((this.options.title) ? 30 : 0);

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

  /**
   * We encode a transaltion to be independent from the dimensions of the visualization
   * @param originalTranslation: Array - original translation value (from screen)
   * @returns encodedTranslation: Array - encoded translation
   */
  encodeTranslation(originalTranslation) {
    const newTx = originalTranslation[0] / (this.scale * this.getWidth());

    const newTy = originalTranslation[1] / (this.scale * this.getHeight());

    return [newTx, newTy];
  }

  /**
   * We decode a translation to adapt it to the dimensions of the visualization
   * @param encodedTranslation: Array - encoded translation
   * @returns originalTranslation: Array - original translation value (from screen)
   */
  decodeTranslation(encodedTranslation) {
    const newTx = encodedTranslation[0] * this.getWidth() * this.scale;

    const newTy = encodedTranslation[1] * this.getHeight() * this.scale;

    return [newTx, newTy];
  }

  /**
   * Restore state from the url hash
   */
  restoreState(defaultZoom) {
    if (!defaultZoom || defaultZoom.length !== 3) return;
    this.scale = defaultZoom[0];
    const originalTranslation = this.decodeTranslation([defaultZoom[1], defaultZoom[2]]);
    this.transX = originalTranslation[0];
    this.transY = originalTranslation[1];
    this.zoomListener.scale(defaultZoom[0])
      .translate(originalTranslation)
      .event(this.svg);
  }

  /**
   * Save state into the url hash
   */
  saveState() {
    const encodedTranslation = this.encodeTranslation([this.transX, this.transY]);
    const exportedData = [this.scale, encodedTranslation[0],
      encodedTranslation[1]];
    if (exportedData[0] !== 1 && exportedData[1] !== 0 && exportedData[2] !== 0) {
      this.maptable.saveState('zoom', exportedData);
    } else {
      this.maptable.removeState('zoom');
    }
  }

  rescale() {
    const self = this;
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

    this.layerGlobal.attr(
      'transform',
      `translate(${this.transX}, ${this.transY})scale(${this.scale})`,
    );

    // Hide tooltip
    if (self.tooltipCountriesNode) self.tooltipCountriesNode.attr('style', 'display:none;');
    if (self.tooltipMarkersNode) self.tooltipMarkersNode.attr('style', 'display:none;');

    // Rescale markers size
    if (this.options.markers) {
      // markers
      this.getAllMtMapMarker().each(function (d) {
        // stroke
        if (d.attr['stroke-width']) {
          d3.select(this).attr('stroke-width', d.attr['stroke-width'] / self.scaleAttributes());
        }
        // radius
        if (d.attr.r) {
          d3.select(this).attr('r', d.attr.r / self.scaleAttributes());
        }
      });
    }

    // Rescale Sun
    if (this.options.night && !this.options.disableSun) {
      d3.selectAll(`${this.containerSelector} .mt-map-sun`).style(
        'r',
        (this.getHeight() * 0.35) / this.scale,
      );
    }

    // Rescale Country stroke-width
    if (this.options.countries) {
      this.getAllMtMapCountry().style(
        'stroke-width',
        this.options.countries.attr['stroke-width'] / this.scale,
      );
    }

    // Rescale heatmap borders
    if (this.options.heatmap && this.options.heatmap.borders) {
      d3.selectAll(`${this.containerSelector} .mt-map-heatmap-borders-paths`)
        .style('stroke-width', this.options.heatmap.borders.stroke / this.scale);
    }

    // save state
    if (this.maptable.firstExecution && this.options.saveState) this.saveState();
  }

  setAttrValues(attrKey, attrValue, dataset) {
    if (typeof (attrValue) === 'number' || typeof (attrValue) === 'string') {
      // Static value
      dataset.forEach((d) => {
        d.attr[attrKey] = attrValue;
      });
    } else if (typeof (attrValue) === 'function') {
      // Dynamic value based on the dataset
      dataset.forEach((d) => {
        d.attr[attrKey] = attrValue(d);
      });
    } else if (typeof (attrValue) === 'object') {
      let scale = 'linear';
      let key = null;
      let mode = 'count';
      let scaleToUse = d3.scale.linear();
      if (attrValue.aggregate) {
        key = (typeof (attrValue.aggregate.key) === 'function')
          ? attrValue.aggregate.key.bind(this.maptable)()
          : attrValue.aggregate.key;

        mode = (typeof (attrValue.aggregate.mode) === 'function')
          ? attrValue.aggregate.mode.bind(this.maptable)()
          : attrValue.aggregate.mode;

        if (typeof (attrValue.aggregate.scale) === 'function') {
          scale = attrValue.aggregate.scale.bind(this.maptable)();
        } else if (attrValue.aggregate.scale) {
          scale = attrValue.aggregate.scale;
        }

        if (!key || !mode) {
          throw new Error(`MapTable: You should provide values 'key' & 'mode' for attr.${attrKey}.aggregate`);
        }

        // Custom aggregate mode
        if (mode === 'sum') {
          attrValue.rollup = (groupedData) => (
            groupedData.map((d) => Number(d[key])).reduce((a, c) => a + c, 0)
          );
        } else if (mode === 'avg') {
          attrValue.rollup = (groupedData) => {
            if (!groupedData.length) return 0;
            const validData = groupedData.filter((d) => !Number.isNaN(Number(d[key])));
            return validData
              .map((d) => Number(d[key]))
              .reduce((a, c) => a + c, 0) / validData.length;
          };
        } else if (mode === 'count') {
          attrValue.rollup = (groupedData) => groupedData.length;
        } else if (mode === 'min') {
          attrValue.rollup = (groupedData) => {
            if (!groupedData.length) return 0;
            const groupedValues = groupedData.map((d) => Number(d[key]));
            return groupedValues.reduce((min, p) => (p < min ? p : min), groupedValues[0]);
          };
        } else if (mode === 'max') {
          attrValue.rollup = (groupedData) => {
            if (!groupedData.length) return 0;
            const groupedValues = groupedData.map((d) => Number(d[key]));
            return groupedValues.reduce((max, p) => (p > max ? p : max), groupedValues[0]);
          };
        } else if (mode.indexOf('percentile') !== -1) {
          const percentile = utils.toNumber(mode);
          attrValue.rollup = (groupedData) => {
            if (!groupedData.length) return 0;
            const groupedValues = groupedData.map((d) => Number(d[key]));
            return utils.quantile(groupedValues, percentile);
          };
        } else if (typeof (attrValue.rollup) === 'function') {
          attrValue.rollup = attrValue.rollup.bind(this.maptable);
        }

        // Custom scale
        if (scale) {
          if (scale.indexOf('log') !== -1) {
            scaleToUse = d3.scale.log();
          } else if (scale.indexOf('pow') !== -1) {
            scaleToUse = d3.scale.pow().exponent(utils.toNumber(scale) || 1);
          } else if (scale === 'sqrt') {
            scaleToUse = d3.scale.sqrt();
          }
          // Rank scale neeed additional transformations
        }
      }

      // Dynamic value based on a scale
      if (!attrValue.rollup) {
        attrValue.rollup = (d) => d.length;
      }
      if (!attrValue.min || !attrValue.max) {
        throw new Error(`MapTable: You should provide values 'min' & 'max' for attr.${attrKey}`);
      }

      dataset.forEach((d) => {
        const aggregatedValue = attrValue.rollup(d.values);
        if (!d.attrProperties) d.attrProperties = {};
        if (!d.attrProperties[attrKey]) d.attrProperties[attrKey] = {};
        d.attrProperties[attrKey].value = aggregatedValue;
        if (key) {
          d.attrProperties[attrKey].key = key;
          d.attrProperties[attrKey].mode = mode;
          d.attrProperties[attrKey].scale = scale;
          const c = this.maptable.columnDetails[key];
          d.attrProperties[attrKey].columnDetails = c;
          const datum = {};
          datum[key] = aggregatedValue;
          d.attrProperties[attrKey].formatted = (c && c.cellContent)
            ? c.cellContent.bind(this.maptable)(datum)
            : aggregatedValue;
        }
      });
      if (scale === 'rank') {
        const positiveRanks = utils.uniqueValues([0].concat(dataset
          .map((d) => Math.floor(d.attrProperties[attrKey].value * 100) / 100)
          .filter((v) => v > 0)));
        const negativeRanks = utils.uniqueValues(dataset
          .map((d) => Math.floor(d.attrProperties[attrKey].value * 100) / 100)
          .filter((v) => v < 0));

        positiveRanks.sort((a, b) => a - b);
        negativeRanks.sort((a, b) => b - a);

        dataset.forEach((d) => {
          if (d.attrProperties[attrKey].value !== 0) {
            const ranks = d.attrProperties[attrKey].value >= 0 ? positiveRanks : negativeRanks;
            const pos = ranks.indexOf(Math.floor(d.attrProperties[attrKey].value * 100) / 100);
            const percentile = Math.round((pos / ranks.length) * 100);
            const newValue = d.attrProperties[attrKey].value < 0
              ? percentile - (percentile * 2)
              : percentile;
            d.attrProperties[attrKey].value = newValue;
          }
        });
      }

      let scaleDomain = d3.extent(dataset, (d) => Number(d.attrProperties[attrKey].value));
      if (scaleDomain[0] === 0 && scale && scale.indexOf('log') !== '-1') {
        scaleDomain = d3.extent(
          dataset.filter((v) => Number(v.attrProperties[attrKey].value) !== 0),
          (d) => Number(d.attrProperties[attrKey].value),
        );
      }
      if (attrValue.transform) {
        scaleDomain[0] = attrValue.transform
          .bind(this.maptable)(scaleDomain[0], this.maptable.data);
        scaleDomain[1] = attrValue.transform
          .bind(this.maptable)(scaleDomain[1], this.maptable.data);
      }

      let minValue = attrValue.min;
      let maxValue = attrValue.max;

      if (attrValue.min === 'minValue') {
        minValue = scaleDomain[0];
      }
      if (attrValue.max === 'maxValue') {
        maxValue = scaleDomain[1];
      }

      // check for negative color declarations
      if ((attrValue.maxNegative && !attrValue.minNegative)
          || (!attrValue.maxNegative && attrValue.minNegative)) {
        throw new Error('MapTable: maxNegative or minNegative undefined. Please declare both.');
      }
      const useNegative = (attrValue.maxNegative && attrValue.minNegative);
      let scaleFunction;
      let scaleNegativeFunction;

      if (useNegative) {
        scaleFunction = scaleToUse.copy()
          .domain([0, scaleDomain[1]])
          .range([minValue, maxValue]);
        scaleNegativeFunction = scaleToUse.copy()
          .domain([scaleDomain[0], 0])
          .range([attrValue.maxNegative, attrValue.minNegative]);
      } else {
        scaleFunction = scaleToUse
          .domain(scaleDomain)
          .range([minValue, maxValue]);
      }

      dataset.forEach((d) => {
        let scaledValue;
        if (!d.values.length || Number.isNaN(d.attrProperties[attrKey].value)) {
          if (typeof (attrValue.empty) === 'undefined') {
            throw new Error(`MapTable: no empty property found for attr.${attrKey}`);
          }
          scaledValue = attrValue.empty;
        } else {
          const originalValueRaw = d.attrProperties[attrKey].value;
          const originalValue = (attrValue.transform)
            ? attrValue.transform.bind(this.maptable)(originalValueRaw, this.maptable.data)
            : originalValueRaw;

          if (useNegative && originalValue < 0) {
            scaledValue = scaleNegativeFunction(originalValue);
          } else {
            scaledValue = scaleFunction(originalValue);
          }
        }
        d.attr[attrKey] = scaledValue;
      });
    } else {
      throw new Error(`Maptable: Invalid value for ${attrKey}`);
    }
  }

  render() {
    if (this.options.markers) this.updateMarkers();
    if (this.options.countries) this.updateCountries();
    if (this.options.night) this.updateNight();
    if (this.options.timezones) this.updateTimezones();
    if (this.options.title) this.updateTitle();
    if (this.options.heatmap) this.updateHeatmap();
    if (this.options.autoFitContent) {
      this.fitContent();
      this.rescale();
    }
    // On render
    if (this.options.onRender && this.options.onRender.constructor === Function) {
      this.options.onRender.bind(this.maptable)();
    }
  }

  updateTitle() {
    if (this.options.title.content) {
      const showing = this.maptable.data.filter((d) => d[this.options.latitudeKey] !== 0).length;
      const total = this.maptable.rawData.filter((d) => d[this.options.latitudeKey] !== 0).length;

      let inlineFilters = '';
      if (this.maptable.filters) {
        inlineFilters = this.maptable.filters.getDescription();
      }

      this.container.querySelector('#mt-map-title').innerHTML = this.options.title
        .content.bind(this.maptable)(
          showing,
          total,
          inlineFilters,
          this.maptable.data,
          this.maptable.rawData,
          this.dataCountries,
        );
    }
  }

  activateTooltip(target, tooltipNode, tooltipContent, isCountry) {
    const self = this;
    target.on(isCountry ? 'mousemove' : 'mouseover', function (d) {
      const content = tooltipContent.bind(this.maptable)(d);
      if (!content) return;
      tooltipNode.html(content).attr('style', 'display:block;position:fixed;');

      let mouseLeft;
      let mouseTop;
      const tooltipDelta = tooltipNode.node().offsetWidth / 2;
      if (isCountry) {
        const mapRect = self.node.getBoundingClientRect();
        const mousePosition = d3.mouse(self.svg.node()).map((v) => parseInt(v, 10));

        mouseLeft = mapRect.left + mousePosition[0] - tooltipDelta;
        mouseTop = mapRect.top + mousePosition[1] + 10;
      } else {
        const targetRect = this.getBoundingClientRect();
        mouseLeft = (targetRect.left + (targetRect.width / 2) - tooltipDelta);
        mouseTop = (targetRect.top + targetRect.height + 2); // +2 is for the border
      }

      tooltipNode.attr(
        'style',
        `top:${mouseTop}px;left:${mouseLeft}px;display:block;position:fixed;`,
      )
        .on('mouseout', () => {
          tooltipNode.style('display', 'none');
        });
    })
      .on('mouseout', () => {
        tooltipNode.style('display', 'none');
      });
  }

  exportSvg() {
    // Get the d3js SVG element
    const svg = this.container.querySelector('#mt-map-svg');
    // Extract the data as SVG text string
    const svgXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
${(new XMLSerializer()).serializeToString(svg)}`;

    if (this.options.exportSvgClient) {
      if (!window.saveAs) {
        throw new Error('MapTable: Missing FileSaver.js library');
      }
      const blob = new Blob([svgXml], { type: 'image/svg+xml' });
      window.saveAs(blob, 'visualization.svg');
    } else if (this.options.exportSvg) {
      const form = this.node.querySelector('#mt-map-svg-form');
      form.querySelector('[name="data"]').value = svgXml;
      form.submit();
    }
  }

  addExportSvgCapability() {
    const exportNode = document.createElement('div');
    exportNode.setAttribute('id', 'mt-map-export');
    this.container.querySelector('#mt-map').appendChild(exportNode);

    const exportButton = document.createElement('button');
    exportButton.setAttribute('class', 'btn btn-xs btn-default');
    exportButton.innerHTML = 'Download';
    exportButton.addEventListener('click', this.exportSvg.bind(this));
    exportNode.appendChild(exportButton);

    if (this.options.exportSvg) {
      const exportForm = document.createElement('div');
      exportForm.innerHTML = `<form id="mt-map-svg-form" method="post"
  action="${this.options.exportSvg}"><input type="hidden" name="data"></form>`;
      exportNode.appendChild(exportForm);
    }
  }
}

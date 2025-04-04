export default {
  map: {
    longitudeKey: 'longitude',
    latitudeKey: 'latitude',
    countryIdentifierKey: 'country_code',
    countryIdentifierType: 'iso_a2',
    zoom: true,
    saveState: true,
    exportSvg: null,
    exportSvgClient: false,
    exportSvgWidth: 940,
    ratioFromWidth: 0.5,
    scaleHeight: 1.0,
    scaleZoom: [1, 10],
    fitContentMargin: 10,
    autoFitContent: false,
    tooltipClassName: 'popover bottom',
    countries: {
      legend: false,
      attr: {
        fill: '#FCFCFC',
        stroke: '#CCC',
        'stroke-width': 0.5,
      },
      tooltipClassName: 'mt-map-tooltip popover bottom',
    },
    heatmap: {
      mask: true,
      weightByAttribute: null,
      weightByAttributeScale: 'linear',
      circles: {
        min: 1,
        max: 90,
        step: 4,
        color: '#FF0000',
        colorStrength: 1,
        blur: 4.0,
      },
      borders: {
        stroke: 1,
        opacity: 0.1,
        color: '#000',
      },
    },
    markers: {
      attr: {
        r: 4,
        fill: 'blue',
        stroke: '#CCC',
        'stroke-width': 0.5,
      },
      tooltipClassName: 'mt-map-tooltip popover bottom',
    },
    title: {
      fontSize: 12,
      fontFamily: 'Helevetica, Arial, Sans-Serif',
    },
  },
  filters: {
    saveState: true,
  },
  table: {
    className: 'table table-striped table-bordered',
    collapseRowsBy: [],
  },
};

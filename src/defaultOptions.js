export default {
  map: {
    longitudeKey: 'longitude',
    latitudeKey: 'latitude',
    countryCodeKey: 'country_code',
    zoom: true,
    legend: false,
    ratioFromWidth: 0.5,
    scaleHeight: 1.0,
    scaleZoom: [1, 10],
    fitContentMargin: 10,
    autoFitContent: false,
    tooltipClassName: 'popover bottom',
    countries: {
      attr: {
        fill: '#FCFCFC',
        stroke: '#CCC',
        'stroke-width': 0.5,
      },
    },
    markers: {
      attr: {
        r: 4,
        fill: 'blue',
        stroke: '#CCC',
        'stroke-width': 0.5,
      },
    },
    title: {
      fontSize: 12,
      fontFamily: 'Helevetica, Arial, Sans-Serif',
    },
  },
  table: {
    className: 'table table-striped table-bordered',
    collapseRowsBy: [],
  },
};

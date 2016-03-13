export default {
  data: {
    longitudeKey: 'longitude',
    latitudeKey: 'latitude',
    filters: {
      enabled: true,
    },
  },
  map: {
    width: 900,
    height: 390,
    legend: false,
    autoWidth: true,
    ratioFromWidth: 0.5,
    scaleHeight: 1,
    scaleZoom: [1, 10],
    animationDuration: 750,
    fitContentMargin: 10,
    autoFitContent: true,
    showNullCoordinates: false,
    tooltipClass: 'popover bottom',
    title: {
      fontSize: 12,
      fontFamily: 'Helevetica, Arial, Sans-Serif',
    },
  },
  table: {
    class: 'table table-striped table-bordered',
    collapseRowsBy: [],
  },
};

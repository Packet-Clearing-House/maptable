Maptable 
========

Its main purpose is to show interactive vector maps synced with a table.

The data on the table is automatically filtered when you zoom on the map.

# Example


```javascript
MapTable.init({

  /* Map width */
  width: 900,

  /* Map height */
  height: 450,

  /* Map selector */
  map_selector: "#map",

  /* Table container selector */
  table_container: "#table",

  /* Table classes */
  table_class: "table table-stripped",

  /* Marker classes */
  marker_class: "marker",

  /* Tooltip classes */
  tooltip_class: "tooltip",

  /* TopoJSON map path */
  map_json_path : "data/world-110m.json",

  /* Countries names path */
  countries_name_tsv_path : "data/country-names.tsv",

  /* Marker radius */
  radius_point : 3,

  /* Enable tooltip for markers */
  tooltip_marker : true,

  /* Enable tooltip for countries */
  tooltip_country : false,

  /* Zoom scale [min, max]
  scale_zoom : [1, 25],

  /* Data path */
  data_csv_path : "data/new.csv",

  /* color range for neighboor countries. Default: null */
  color_range: ["#91A6BB", "#97ABBF", "#9DB0C3", "#A4B5C6", "#AABACA", "#AFBFCE", "#B5C4D2", "#BCC9D5", "#C2CED9", "#C8D3DD"],

  /* Data columns */
  table_columns : [
    {rawName: "region", displayName: "Region"},
    {rawName: "countryLong", displayName: "Country"},
    {rawName: "city", displayName: "City"},
    {rawName: "participants", displayName: "Participants"},
    {rawName: "traffic", displayName: "Traffic"},
    {rawName: "prefixes", displayName: "Prefixes"},
    {rawName: "established", displayName: "Established"}
  ],

  /* Marker tooltip format */
  tooltip_marker_content : function(d){
    return "<strong>" + d.formattedAddress + "</strong> <br> <strong>Participants:</strong> " + d.participants + "<br> <strong>Traffic:</strong> " + d.traffic + "";
  },

  /* Country tooltip format */
  tooltip_country_content : function(d){
    return d.name;
  }

};

```


# Contribute

You are welcomed to fork the project and make pull requests.
Be sure to create a branch for each feature!


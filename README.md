# MapTable

[![GitHub stars](https://img.shields.io/github/stars/Packet-Clearing-House/maptable.svg?style=social&label=Star)]() [![GitHub release](https://img.shields.io/github/release/Packet-Clearing-House/maptable.svg)]() [![license](https://img.shields.io/github/license/Packet-Clearing-House/maptable.svg)]()

MapTable's primary function is to convert any dataset to a customizable set of components of Map, Filters and Table:

- **Map** - A fully customizable (zoom & pan) choropleth or heat map rendered using SVG. The map can be exported to a stand alone SVG for external consumption. The map can include markers based on lat/lon with tooltips. Markers and Map are dynamically update based on filters.
- **Table** - A tabular representation of your dataset which can be sorted by header rows. Primary sort is the first click and secondary sort is the second click when shift is held down. This also dynamically responds to filters.
- **Filters** - A programmatically generated list of drop downs and input fields to drill down into your dataset

This library was originally conceived to render the [home page](https://pch.net) and next generation of [IXP directory](https://www.pch.net/ixp/dir) for Packet Clearing House ([PCH](https://pch.net)).

You can also browse [other code samples and **examples**](https://packet-clearing-house.github.io/maptable/)

[<img src="https://packet-clearing-house.github.io/maptable/screenshots/minimal.png">](https://packet-clearing-house.github.io/maptable/#minimal) [<img src="https://packet-clearing-house.github.io/maptable/screenshots/table-only.png">](https://packet-clearing-house.github.io/maptable/#table-only) [<img src="https://packet-clearing-house.github.io/maptable/screenshots/custom-markers.png">](https://packet-clearing-house.github.io/maptable/#custom-markers)

[<img src="https://packet-clearing-house.github.io/maptable/screenshots/tooltip-country.png">](https://packet-clearing-house.github.io/maptable/#tooltip-country) [<img src="https://packet-clearing-house.github.io/maptable/screenshots/6000-markers.png">](https://packet-clearing-house.github.io/maptable/#6000-markers) [<img src="https://packet-clearing-house.github.io/maptable/screenshots/heatmap.png">](https://packet-clearing-house.github.io/maptable/#heatmap)

## Table of Contents

- [Dependencies](#dependencies)

- [Declaring MapTable elements](#declaring-maptable-elements)
- [Import datasets](#import-datasets)
- [Map datasets](#map-datasets)
- [Declaring MapTable elements](#declaring-maptable-elements)
  - [Import datasets](#import-datasets)
  - [Map datasets](#map-datasets)
  - [Dataset requirements](#dataset-requirements)
  - [Columns details](#columns-details)
    - [columnsDetails format](#columnsdetails-format)
- [Naming conventions](#naming-conventions)
  - [Map](#map)
    - [Options](#options)
- [Filters](#filters)
  - [Options](#options-1)
- [Table](#table)
  - [Options](#options-2)
- [Export as SVG](#export-as-svg)
- [Credits](#credits)
- [Contribute](#contribute)
  - [Set up your development environment](#set-up-your-development-environment)
    - [Requirements](#requirements)
    - [Getting Started](#getting-started)
  - [Todo](#todo)
- [Release History](#release-history)

## Dependencies

- [D3.js](https://d3js.org/)
- TopoJSON\*: [homepage](https://github.com/mbostock/topojson) or [download (cdnjs)](https://cdnjs.com/libraries/topojson)
- FileSaver.js\*: [homepage](https://github.com/eligrey/FileSaver.js) or [download (cdnjs)](https://cdnjs.com/libraries/FileSaver.js) - only used if you want to do client side SVG export

\* Only used if you need a map

## <a name="render"></a>Install

Here is minimum amount of HTML to render a MapTable with Map, Filter and Table.

```html
<div id="vizContainer"></div>

<script src="d3.min.js"></script>
<!-- You can import it from cdnjs.com or bower-->
<script src="topojson.min.js"></script>
<!-- You can remove this line if you're not using the map -->
<!-- You can import it from cdnjs.com or bower -->
<script src="maptable.min.js"></script>
<!-- You can import it from cdnjs.com or bower -->
<script>
  var viz = d3
    .maptable('#vizContainer')
    .csv('dataset.csv')
    .map({ path: 'world-110m.json' }) // You can remove this line if you want to disable the map
    .filters() // You can remove this line if you want to disable filters
    .table() // You can remove this line if you want to disable the table
    .render(); // This is important to render the visualization
</script>
```

MapTable is available on cdnjs.com. Remember though, cool kids concatenate their scripts to minimize http requests.

If you want to style the MapTable elements with some existing styles, you can prepend the above HTML with:

```html
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" /> <link rel="stylesheet" href="../maptable.css" />
```

## Declaring MapTable elements

To create a visualization (Map or/and Table or/and Filters) of your dataset, you need to provide first the container of your visualization

```html
<div id="vizContainer"></div>
```

The default order of the 3 components is `Map`, `Filters` and `Table`. If you want to place the components in a different order, you can put them on the main container:

```html
<div id="vizContainer">
  <div id="mt-map"></div>
  <div id="mt-filters" class="panel panel-default"></div>
  <div id="mt-table"></div>
</div>
```

You instantiate the MapTable library into the `viz` variable based on the `#vizContainer` ID you declared in the DOM:

```html
<script>
  var viz = d3.maptable('#vizContainer'); // #vizContainer is the css selector that will contain your visualization
</script>
```

The MapTable `viz` declaration in the above example is a chain of functions. The possible functions that you can use are:

- [viz.json(jsonPath\[, preFilter\])](#viz-json) with `jsonPath` as string and `preFilter` as function that filters the dataset upfront.
- [viz.jsonData(jsonData\[, preFilter\])](#viz-json) with `jsonData` as string and `preFilter` as function that filters the dataset upfront.
- [viz.csv(csvPath\[, preFilter\])](#viz-csv) with `csvPath` as string and `preFilter`.
- [viz.csvData(csvData\[, preFilter\])](#viz-csv) with `csvData` as string and `preFilter`.
- [viz.tsv(tsvPath\[, preFilter\])](#viz-tsv) with `tsvPath` as string and `preFilter`.
- [viz.tsvData(tsvData\[, preFilter\])](#viz-tsv) with `tsvData` as string and `preFilter`.
- [viz.columns(columnDetails)](#columns-details) with `columnDetails` as a JS dictionary. You can add/remove it of you want to customize your columns or create virtual columns based on the data.
- [viz.map(mapOptions)](#map) with `mapOptions` as a JS dictionary. You can add/remove it of you want a map on your visualization.
- [viz.filters(filtersOptions)](#filters) with `filtersOptions` as a JS dictionary. You can add/remove it of you want filters on your visualization.
- [viz.table(tableOptions)](#table) with `tableOptions` as a JS dictionary. You can add/remove it of you want a table on your visualization.
- [viz.render([onComplete])](#render) that closes the chain and renders the visualization. Don't forget this! It can take an optional callback function onComplete, that's executed when MapTable finishes rendering its components. For example if you have `function alertTest(){ alert('test!'); }` you would call it with `viz.render(alertTest)`.

_Example with preFilter_

```js
var viz = d3
  .maptable('#vizContainer')
  .json('dir_data.json', (d) => parseInt(d.traffic) > 0)
  .map({ path: 'countries.json' })
  .render();
```

### Import datasets

Datasets can be defined by using one of the these three sources:

<a name="viz-json">\#</a> `viz.json(url)`

Import JSON file at the specified url with the mime type "application/json".

<a name="viz-csv">\#</a> `viz.csv(url)`

Import CSV file at the specified url with the mime type "text/csv".

<a name="viz-tsv">\#</a> `viz.tsv(url)`

Import TSV file at the specified url with the mime type "text/tab-separated-values".

### Map datasets

To plot lands and countries on the map, we're using TopoJSON library. The map can be generated through this tool: [topojson-map-generator](https://github.com/melalj/topojson-map-generator).

### Dataset requirements

In order to plot your dataset on a map, there are minimum set of columns needed.

If you're planning to add markers on your map, you would need to provide `latitude`, `longitude` of your markers. You can also edit these keys name using the map options `longitudeKey`, `latitudeKey`.

```json
[
  { "longitude": "13.23000", "latitude": "-8.85000" },
  { "longitude": "168.32000", "latitude": "-17.75000" }
]
```

If you're planing to add country related information, you should provide consistent country information on your dataset from the TopJSON file.
You should provide at least one of these types on your mapOptions:

- `countryIdentifierKey:` _(string, default: 'country_code')_ Column name of country identifier (from the dataset). It goes as pair with the option `countryIdentifierType`.
- `countryIdentifierType:` _(string, default: 'iso_a2')_ Country identifier type that we're using to attach data to countries on the map. The available types are:
  - `iso_a2` (default): [ISO_3166-1_alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code format
  - `iso_a3`: [ISO_3166-1_alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) country code format
  - `name`: Country name that came from the GeoJSON map file.
  - `continent`: Continent name that came from the GeoJSON map file.

For example for this dataset:

```json
[
  { "country_code": "MAR", "Country Name": "Morocco", "bar": "foo" },
  { "country_code": "FRA", "Country Name": "France", "bar": "foo" }
]
```

You would use these options:

```js
{
  countryIdentifierKey: 'country_code',
  countryIdentifierType: 'iso_a3'
}
```

or

```js
{
  countryIdentifierKey: 'Country Name',
  countryIdentifierType: 'name'
}
```

### Columns details

By default, MapTable imports all the columns and detects their format automatically. As well, you can customize behaviors of specific columns and create virtual columns.

\# `viz.columns(columnDetails)` with `columnDetails` as a JS dictionary. You can add/remove it of you want to customize your columns or create virtual columns based on the data.

#### columnsDetails format

- `<PUT_YOUR_COLUMN_KEY>:` _(Object)_ Provide the columns key here to apply the options below to it. If this key is not defined in yoru dataset, then it will be dynamically added as virtual column:
  - `nowrap:` _(bool, default: false)_ When present, it specifies that the content inside a that column should not wrap.
  - `title:` _(string, default: columnKey)_ What we show as column name in filters and table.
  - `filterMethod:` _(string, default: 'field')_ Column format type, used for filtering. Available options:
    - `field`: filter by keyword
    - `dropdown`: exact match using a dropdown
    - `compare`: filter using comparison (≥, ≤, between ....)
  - `virtual`: _(function(d), default: null)_ To create a new column that doesn't exists in the dataset, and we'd like to show it on the table or filters. You can also use it if you want to transform an existing column.
  - `cellContent`: _(function(d), default: null)_ Function that transforms an existing content using other rows. (for example to change the color depending on the data).
  - `dataParse:` _(function(d), default: null)_ Function that return the formatted data used to sort and compare cells.
  - `filterInputType:` _(string, default: 'text')_ HTML input type that we're using for the filters for that specific column (e.g. date, number, tel ...)

_Example (adding `nowrap` and `type` to the `region` column key):_

```js
.columns({
  region: {
    nowrap: true,
    filterMethod: 'dropdown'
  }
})
```

## Naming conventions

For the below examples, we define `viz` as the variable that loads MapTable.

Functions that have `d` as parameter, means that `d` is a JS dictionary that contains data for one row.

Functions that have `groupedData` as parameter, means that `groupedData` is a JS dictionary `{ key: 'groupedByKey', values: [ {d}, ... ] }` that contains the key that have been used to group the data, and the matching values related to that grouping.

### Map

\#`viz.map(mapOptions)` with `mapOptions` as a JS dictionary. You can add/remove it of you want a map on your visualization.

#### Options

- `path:` _(string, **required** if pathData not set)_ URL of the TOPOJSON map, you can get them from Mike Bostock's repo: [world atlas](https://github.com/mbostock/world-atlas) and [us atlas](https://github.com/mbostock/us-atlas). Or use [this tool](https://github.com/melalj/topojson-map-generator) to generate these files as we did on the examples.
- `pathData:` _(string, **required** if path not set)_ string containing the TOPOJSON map
- `onComplete:` _(function, default: null)_ Callback function when the map first loaded.
- `onRender:` _(function, default: null)_ Callback function when the map finished rendering.
- `width:` _(integer, default:'window.innerWidth')_ Map Width.
- `height:` _(integer, default:'window.innerHeight')_ Map Height.
- `saveState:` _(bool, default: true)_ Save zoom state into the URL
- `zoom:` _(bool, default: true)_ Enable zoom on the map (when scrolling up/down on the map).
- `filterCountries:` _(function(country))_ Filter countries follow a specific condition.
  _Example:_

        ```js
        filterCountries: (country) => country.id !== 'AQ', // to remove Antarctica from the map
        ```

- `title:` _(object, default: *see below*)_ Add a title within the map.

  - `title.bgColor:` _(string, default: '#000000')_ Title font size.
  - `title.fontSize:` _(integer, default: 12)_ Title font size.
  - `title.fontFamily:` _(string, default: 'Helevetica, Arial, Sans-Serif')_ Title font family.
  - `title.content:` _(function(countShown, countTotal, filtersDescription)_ Function to define how the title is rendered
  - `title.source:` _(function())_\_ Function to define how the HTML in the title.
    _Example:_

        ```js
        title: {
          bgColor: "#F5F5F5",
          fontSize: "11",
          content: function(countShown, countTotal, filtersDescription) {
            if (countShown === 0 || countTotal === 0) out = "No data shown";
            else if (countShown < countTotal) out = 'Showing <tspan font-weight="bold">' + countShown + '</tspan> from <tspan font-weight="bold">' + countTotal + "</tspan>";
            else out = '<tspan font-weight="bold">' + countTotal + "</tspan> shown";

            if (filtersDescription !== '') out += " — " + filtersDescription;
            return out;
          },
          source: function() {
            return 'Source: <a xlink:href="http://www.example.com" target="_blank"><tspan font-weight="bold">example.com</tspan></a>';
          }
        },
        ```

- `scaleZoom:` _([integer, integer], default: [1, 10])_ The map zoom scale.
- `scaleHeight:` _(float, default: 1.0)_ Ratio to scale the map height.
- `autoFitContent:` _(bool, default: true)_ Enable auto zoom to focus on the active markers.
- `fitContentMargin:` _(integer, default: 10)_ Padding in pixels to leave when we filter on a specific area.
- `ratioFromWidth:` _(float, default: 0.5)_ Ratio between the height and the width: height/width, used to deduce the height from the the width.
- `countryIdentifierKey:` _(string, default: 'country_code')_ Column name of country identifier (from the dataset). It goes as pair with the option `countryIdentifierType`.
- `countryIdentifierType:` _(string, default: 'iso_a2')_ Country identifier type that we're using to attach data to countries on the map. The available types are:
  - `iso_a2` (default): [ISO_3166-1_alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code format
  - `iso_a3`: [ISO_3166-1_alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) country code format
  - `name`: Country name that came from the GeoJSON map file.
  - `continent`: Continent name that came from the GeoJSON map file.
- `longitudeKey:` _(string, default: 'longitude')_ Column name of the longitude (from the dataset).
- `latitudeKey:` _(string, default: 'latitude')_ Column name of the latitude (from the dataset).
- `defaultScaleTo:` _(object or function(), default:null)_ Default zoom state for the map based on either Country code or Latitude/Longitude point.

  - `defaultScaleTo.scaleType:` _(string, default:null)_ Type of a zoom/scale on the map. This only accepts two types: 'coordinates' for a zoom based on latitude and longitude points or 'country' for a zoom based on specific country code(iso_a3 code).
  - `defaultScaleTo.values` _(object, default:null)_ Option values for the zoom state on the map based on 'scaleType' property. If 'scaleType' is set to 'coordinates' then its 'values' object should contain: 'latitude','longitude' and 'scale' properties. If 'scaleType' is set to 'country' then its 'values' object should contain: 'iso_a3' property.

    _Example:_

    ```js
    defaultScaleTo: {
      scaleType: 'coordinates',
      values: {
        latitude: 27.7,
        longitude: 85.37,
        scale: 32
      }
    },
    ```

- `exportSvg:` _(string, default: null)_ URL endpoint to download the current visualization as SVG. Read more on the section export SVG. (more details on a the section "Export as SVG")
- `exportSvgClient:` _(bool, default: false)_ Show button to download the current visualization as SVG using only the client browser instead of querying the backend (in the opposite of `exportSvg`). You'll need to download [FileSaver.js](https://github.com/eligrey/FileSaver.js) and add a `<script src="filesaver.min.js">` to make it work. You may also use the [CDN version](https://cdnjs.com/libraries/FileSaver.js) in your `<script>` source.
- `exportSvgWidth:` _(integer, default: 940)_ Sets custom export dimensions (i.e. width & height) for SVG based on passed width value. 
- `watermark:` _(object, default: null)_ Add a watermark within the map.

  - `watermark.src:` _(string)_ URL of the image (svg, png, jpg).
  - `watermark.width:` _(integer)_ Image width.
  - `watermark.height:` _(integer)_ Image height.
  - `watermark.position:` _(string)_ Watermark position (top|middle|bottom) (left|middle|right). e.g. `bottom left`.
  - `watermark.style:` _(string)_ Additional css style for the watermark.

    _Example:_

    ```js
    watermark: {
      src: 'https://example.com/image.svg',
      width: 130,
      height: 60,
      position: "bottom left",
      style: "opacity:0.1"
    },
    ```

- `markers:` _(object, enabled by default)_ Add markers on the map. Set it to `false` to disable it.

  - `markers.customTag:` _(function(markerObject)), default: null)_ This is more advanced feature. If you'd like to override the default market tag (svg:circle) to something different (like an image), you can use this callback function to append to the markerObject your custom implementation (see below example). x and y are coordinates in pixels of the marker.
  - `markers.attrX:` _(string, default: 'cx')_ Attribute to position the marker on the X-Axis
  - `markers.attrY:` _(string, default: 'cy')_ Attribute to position the marker on the Y-Axis
  - `markers.attrXDelta:` _(integer, default: 0)_ Left relative margin of the marker
  - `markers.attrYDelta:` _(integer, default: 0)_ Top relative margin of the marker
  - `markers.groupBy:` _(function(groupedData))_ Given groupedData (the current row), function that returns a value that we group markers by. See [this example](https://packet-clearing-house.github.io/maptable/#aggregate) for an implementation example.
  - `markers.tooltipClassName:` _(string, default: 'mt-map-tooltip popover bottom')_ Class name of the tooltip used for markers (we're using bootstrap).
  - `markers.tooltip:` _(function(groupedData))_ Function that returns html that we would use as content for the tooltip. We recommend you to use the bootstrap popover..
  - `markers.attr:` _(object)_ The markers are by default SVG circle, you can custumize the radius, color or stoke of these markers here. You can use the attribute `r` to set the radius or `fill` for the color. More details on possible attributes [here](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle). We'll use `r` as example in the following documentation.

    - `markers.attr.r:` \_(string or integer)\_To set a static value
    - `markers.attr.r:` _(function)_ To represent the radius value based on the dataset, see [this example](https://packet-clearing-house.github.io/maptable/#dynamic-markers) on how we set the marker color `fill` based on the dataset.
    - `markers.attr.r:` _(object)_ Use an object with the following keys to correlate the value of the radius with the dataset

      - `markers.attr.r.aggregate:` _(object)_ Information on how we aggregate data. See [this example](https://packet-clearing-house.github.io/maptable/#aggregate) to understand how we adjusted the radius of the markers based on the dataset.
      - `markers.attr.r.aggregate.key:` _(string)_ Which column we'll use to aggregate the value (it need to be a number)
      - `markers.attr.r.aggregate.mode:` _(enum('sum', 'count', 'avg', 'min', 'max', '50percentile', '95percentile'), default to 'count')_ what aggreation function we'll use.
      - `markers.attr.r.aggregate.scale:` _(enum('linear', 'rank', 'sqrt', 'pow2', 'pow3', 'log'), default: 'linear')_ what scale we'll aggregate the data.
      - `markers.attr.r.min:` _(string or integer)_ Attribute value for the minimum value on the scale
      - `markers.attr.r.max:` _(string or integer)_ Attribute value for the maximum value on the scale
      - `markers.attr.r.empty` _(string or integer)_ Attribute value if no data is linked to that country
      - `markers.attr.r.rollup:` **DEPRECATED (use aggregate instead)** _(function(groupedData), default: groupedData => groupedData.length)_ Function for the values we're attaching to the country and attribute. return value needs to be an array that contains rows that match that country or marker. Defaults to `values.length`, the count of matching markers
      - `markers.attr.r.transform:` _(function(value, allRows), default: value)_ Function for changing the value for the current country. Can only accept value `transform(value)` to do a simple `Math.log(value)` call or be defined to use more advanced logic with `transform(value, allRows)` and then iterate over `allRows` (all rows from your csv/tsv/json) to calculate relative values like percentile. (It's recommended to use `aggreggate` if you want to have a different scale).

        _Example (grouping by value):_

      ```js
       markers: {
         tooltip: function(a) {
           out = '<div class="arrow"></div>';
           out += '<span class="badge pull-right"> ' + a.values.length + '</span><h3 class="popover-title"> ' + a.key + '</h3>';
           out += '<div class="popover-content">';
           for (i = 0; i < a.values.length; i++) out += " • " + a.values[i].long_name + "<br>";
           out += "</div>";
           return out;
         },
         attr: {
           r: { /* r is the circle attribute for radius */
             min: 1,
             max: 10,
             aggregate: {
               mode: "avg",
               key: "traffic",
               scale: "log10",
           }
         },
         fill: function(groupedData) {
           var totalTraffic = 0;
           groupedData.values.forEach(function(d) {
             totalTraffic += Number(d.traf);
           });
           if (totalTraffic && totalTraffic > 50000000) return 'green';
           return 'red';
         },
         stroke: "#d9d9d9",
         "stroke-width": 0.5
        }
      },
      ```

      _Example (with custom tag - Advanced feature):_

      ```js
       markers: {
         className: 'starsMarker',
         customTag: function(markerObject){
           return markerObject.append("svg:image")
             .attr("xlink:href", "https://www.example.com/star.svg")
             .attr("width", "13")
             .attr("height", "27");
         },
         attrX: 'x',
         attrY: 'y',
         attrXDelta: -6,
         attrYDelta: -13
       },
      ```

- `countries:` _(object, enabled by default)_ Add countries on the map. You can **not** use this with `map.heatmap`. Set it to `false` to disable it.

  - `countries.tooltip:` _(function(groupedData))_ Function that returns html that we would use as content for the tooltip. We recommend you to use the bootstrap popover. The parameter is `groupedData` (check above on the naming conventions for more details).
  - `countries.attr:` _(object)_ The countries are by default SVG path, you can custumize the color or stoke here. You can use the attribute `fill` to set the color. More details on possible attributes [here](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path). We'll use `fill` as example in the following documentation.

    - `countries.attr.fill:` _(string or integer)_ To set a static value
    - `countries.attr.fill:` _(function)_ To represent the color value based on the dataset.
    - `countries.attr.fill:` _(object)_ Use an object with the following keys to correlate the value of the radius with the dataset

      - `countries.attr.fill.aggregate:` _(object)_ Information on how we aggregate data. See [this example](https://packet-clearing-house.github.io/maptable/#aggregate) to understand how the countries colors change based on the number of markers per country (choropleth).
      - `countries.attr.fill.aggregate.key:` _(string)_ Which column we'll use to aggregate the value (it need to be a number)
      - `countries.attr.fill.aggregate.mode:` _(enum('sum', 'count', 'avg', 'min', 'max', '50percentile', '95percentile'), default to 'count')_ what aggreation function we'll use.
      - `countries.attr.fill.aggregate.scale:` _(enum('linear', 'rank', 'sqrt', 'pow2', 'pow3', 'log10'), default: 'linear')_ what scale we'll aggregate the data.
      - `countries.attr.fill.min:` _(string or integer)_ Attribute value for the minimum value on the scale
      - `countries.attr.fill.max:` _(string or integer)_ Attribute value for the maximum value on the scale
      - `countries.attr.fill.minNegative:` _(string or integer, optional)_ Attribute value for the minimum (closest to 0) negative value. Use this and `maxNegative` if you want to show different colors on the map for negative values. It is optional. see [this example](https://packet-clearing-house.github.io/maptable/#negative-values) for an implementation example.
      - `countries.attr.fill.maxNegative:` _(string or integer, optional)_ Attribute value for the maximum (farthest from 0) negative.
      - `countries.attr.fill.empty` _(string or integer)_ Attribute value if no data is linked to that country
      - `countries.attr.fill.legend:` _(bool, default: false)_ show or hide the legend
      - `countries.attr.fill.rollup:` _(function(groupedData), default: groupedData => groupedData.length)_ **DEPRECATED (use aggregate instead)** Function for the values we're attaching to the country and attribute. return value needs to be an array that contains rows that match that country or marker. Defaults to `values.length`, the count of matching countries
      - `countries.attr.fill.transform:` _(function(value, allRows), default: value)_ Function for changing the value for the current country. Can only accept value `transform(value)` to do a simple `Math.log(value)` call or be defined to use more advanced logic with `transform(value, allRows)` and then iterate over `allRows` (all rows from your csv/tsv/json) to calculate relative values like percentile. (It's recommended to use `aggreggate` if you want to have a different scale).

        _Example_

      ```js
      countries: {
        tooltip: function(a) {
          out = '<div class="arrow"></div>';
          if (a.values.length === 0) {
            out += '<h3 class="popover-title"> ' + a.key + '</h3>';
            out += '<div class="popover-content">N/A</div>';
          } else {
            out += '<h3 class="popover-title"> ' + a.values[0]['country_name'] + '</h3>';
            out += '<div class="popover-content">' + a.values.length + '</div>';
          }
          return out;
        },
        attr: {
           fill: {
             min: "#a9b6c2",
             max: "#6c89a3",
             empty: "#f9f9f9",
             aggregate: {
               mode: "sum",
               key: "traffic",
               scale: "sqrt"
             }
          },
          stroke: "#d9d9d9",
          "stroke-width": 0.5
        },
      },
      ```

- `night:` _(object, default: null)_ Add the night layer to the map

  - `night.date:` _(Date, default: new Date())_ Which datetime do we want to display the night layer
  - `night.disableSun:` _(boolean, default: false)_ if you want to disable the sun layer
  - `night.sunRadius:` _(number, default: 10)_ radius of the sun

    _Example_

    ```js
     night: {
       date: new Date(Date.parse('2023-01-01T00:00:00Z')),
    },
    ```

- `timezones:` _(object, default: null)_ Add the timezones layer to the map

  - `timezones.path:` _(string, required if pathData not provided)_ remote url of the topojson layers of the timezones
  - `timezones.pathData:` _(string, required if path not provided)_ inline data of the topojson layers of the timezones

- `heatmap:` _(object, default: null)_ Add a heatmap on the map - we use concentrated circles on every location in the dataset. You can **not** use this with `map.countries.`. See [this example](https://packet-clearing-house.github.io/maptable/#heatmap) for an implementation example.

  - `heatmap.weightByAttribute:` _(function(d), default: null)_ Which attribute we would weight the gradient. it takes a anonymous function that exposes `d` as one row, and expect a float as returned value.
  - `heatmap.colorStrength:` _(float, default: 1)_ Adjusts heatmap color strength, (0 make things transparent, 1 normal behavior, > 1 to make the color darker)
  - `heatmap.weightByAttributeScale:` _('log' or 'linear', default: 'linear')_ Which scale we would use for the weight (only if `weightByAttribute` is set).
  - `heatmap.mask:` _(bool, default: true)_ Mask the heatmap with countries so heatmap doesn't go over oceans
  - `heatmap.circles:` _(object)_ Properties of the circles that makes the heatmap gradient
  - `heatmap.circles.color:` _(string, default: "#FF0000")_ The color in HEX of the heatmap circles.
  - `heatmap.circles.blur:` _(float, default: 4.0)_ Blur radius that we apply on the heatmap.
  - `heatmap.borders:` _(object)_ Enable country borders. Set to `false` to disable it.
  - `heatmap.borders.stroke:` _(integer, default: 1)_ Country border stroke width.
  - `heatmap.borders.opacity:` _(integer, default: 0.1)_ Country border stroke opacity.
  - `heatmap.borders.color:` _(string, default: "#000")_ Country border stroke color.

    _Example_

    ```js
    heatmap: {
      weightByAttribute: function(d) {
        return parseInt(d.traf, 10);
      },
      weightByAttributeScale: 'log',
      circles: {
        color: '#0000FF',
        blur: 6.0,
      },
      borders: {
        opacity: 0.2,
      },
    },
    ```

## Filters

\# `viz.filters(options)` with `filtersOptions` as a JS dictionary. You can add/remove it of you want filters on your visualization.

### Options

- `show:` _([string, ...], default: null)_ Set the order and the columns that we want to see in the filters.
- `saveState:` _(bool, default: true)_ Save filters state into the URL

## Table

If you want to add a table on your visualization:

\# `viz.table(tableOptions)` with `tableOptions` as a JS dictionary. You can add/remove it of you want a table on your visualization.

### Options

- `show:` _([string, ...], default: null)_ Set the order and the columns that we want to see in the table.
- `onComplete:` _(function, default: null)_ Callback function when the table first loaded.
- `onRender:` _(function, default: null)_ Callback function when the table finished rendering.
- `className:` _(string, default: 'table table-striped table-bordered')_ Table class name
- `rowClassName:` _(function(d), default: null)_ Function that returns the row class name depending on its content. Useful to highlight rows.
- `defaultSorting:` _(object or table or object, default: see below)_ How we sort things on the table. You can specify an object with `key` & `mode` values for default primary sorting. You can also specify an array of two or three objects for secondary and tertiary sorting.
  - `defaultSorting.key:` _(string, default: <first column shown>)_ default sorting on which column.
  - `defaultSorting.mode:` _(string, default: 'asc')_ sorting mode: `asc` for ascending, `desc` for descending.
- `dataGroupSeparator:` _({enabled: boolean}, default: null)_ Enable this to display data group separator lines.
- `dataCountIndicator:` _({enabled: boolean}, default: null)_ Enable this to display data count indication numbers.
- `customSortOrder:` _([object,...], default: null)_ You can pass custom sorting order list for `months` & `days` data types for any column. You should pass an array of objects where each object should consist column `key` and an array of sort `order` string values for that column. Example : [{key:'day',order:['sunday','monday',...]}].
- `collapseRowsBy:` _([string, ...], default: null)_ Array of columns that we want to be collapsed.

## Export as SVG

You can enable this feature via `exportSvg` and set it to a URL. This will allow users download the map on their computer as an SVG. However, you would need to set up a server endpoint that is going to allow users download the SVG file.

The sample code for a PHP server is located in `/server/exportSvg.php`. Contributions are welcomed for implementations of in other languages.

In the version 1.4.0 `exportSvgClient` was added to use only the browser to export the SVG.

## Credits

- Simo Elalj [@melalj](https://github.com/melalj) - Original Author & Lead Architect
- Ashley Jones [@Ths2-9Y-LqJt6](https://github.com/Ths2-9Y-LqJt6) - Feature Requester & Deliverer, QA, Love, Release Engineer

## Contribute

You are welcomed to fork the project and make pull requests.

### Set up your development environment

#### Requirements

Install any items with "sudo":

- [NVM](https://github.com/nvm-sh/nvm), to support any nodejs version

#### Getting Started

Run these commands as your unprivileged user you're doing your development as:

1. Run `nvm install 16` to install node 16
1. Run `nvm use 16` to use node 16
1. Run `npm config set python $(which python)` to use set the python path
1. Run `npm install` to install dependencies
1. Run `npm run dev` to start the local dev environment on [http://localhost:5000](http://localhost:5000)
1. Edit files in `./dev` and they will be automatically compiled to `./src`
1. To have production ready files, run: `gulp dist`. All built files are located in the folder `./dist`
1. Enjoy 🍻

## Release History

- Version 2.2.2 April 22 2023
  - timezones: Removed text for UTC+14
- Version 2.2.1 April 22 2023
  - night: Croping the night layer to remove Antartica
  - timezones: Time values are now inside the timezone stripes
  - timezones: set default sans serif font for the times
- Version 2.2.0 April 10 2023
  - Added `map.timezones` to display the timezone stripes
- Version 2.1.0 April 10 2023
  - Added `map.night` to display the night layer and the sun
- Version 2.0.0 April 10 2023
  - Added `csvData`, `jsonData`, `tsvData`, and `map.pathData`
  - Fixed case sentivity for table sorting
  - Tested build with Node 16 (using nvm)
- Version 1.7.3 November 26 2018
  - Changed the rank worked so that value of `0` is included in ranks.
- Version 1.7.2 November 15 2018
  - Change first click on column head to be Descending instead of Ascending - [Issue #95](https://github.com/Packet-Clearing-House/maptable/issues/95)
  - Fix some corner cases this.legendCountry[attrKey] is not defined in GeoMap.js - [Issue #96](https://github.com/Packet-Clearing-House/maptable/issues/96)
- Version 1.7.1 November 14 2018
  - Fix Excessive updates to window history - [Issue #93](https://github.com/Packet-Clearing-House/maptable/issues/93)
- Version 1.7.0 November 14 2018 (Also includes items in unreleased 1.6.1)
  - Allow map to be re-rendered with a column sort - [Issue #88](https://github.com/Packet-Clearing-House/maptable/issues/88)
  - Fix cellContent: function(d) is called twice for every cell - [Issue #87](https://github.com/Packet-Clearing-House/maptable/issues/87)
  - Fix Examples JS errors, padding - [Issue #86](https://github.com/Packet-Clearing-House/maptable/issues/86)
  - Support secondary sorting in defaultSorting - [Issue #78](https://github.com/Packet-Clearing-House/maptable/issues/78)
  - Provide dataset to map.title.content function to have better customizations - [Issue #77](https://github.com/Packet-Clearing-House/maptable/issues/77)
  - Be able to set a property (like attr.fill) of an attribute based on the data - [Issue #76](https://github.com/Packet-Clearing-House/maptable/issues/76)
- Version 1.6.0 July 16 2018
  - Add ability to support secondary sorting in defaultSorting - [Issue #78](https://github.com/Packet-Clearing-House/maptable/issues/78)
  - Add ability to provide dataset to map.title.content function to have better customizations - [Issue #77](https://github.com/Packet-Clearing-House/maptable/issues/77)
  - Add ability to set a property (like attr.fill) of an attribute (eg marker) based on the data - [Issue #76](https://github.com/Packet-Clearing-House/maptable/issues/76)
  - Fix first column as defaultSorting - [Issue #71](https://github.com/Packet-Clearing-House/maptable/issues/71)
  - Fix sorting, virtual columns demo - [Issue #70](https://github.com/Packet-Clearing-House/maptable/issues/70)
- Version 1.5.3 June 19 2018
  - More better fix for permalink - [Issue #74](https://github.com/Packet-Clearing-House/maptable/issues/74)
- Version 1.5.2 June 18 2018
  - Fix permalink bug - [Issue #71](https://github.com/Packet-Clearing-House/maptable/issues/71)
  - Update browser-sync - [Issue #73](https://github.com/Packet-Clearing-House/maptable/issues/73)
- Version 1.5.1 May 22 2017
  - Fix default sort bug - [Issue #66](https://github.com/Packet-Clearing-House/maptable/issues/66)
- Version 1.5.0 May 22 2017
  - Improve heatmap falloff - [Issue #58](https://github.com/Packet-Clearing-House/maptable/issues/58)
  - Improve heatmap colors - [Issue #56](https://github.com/Packet-Clearing-House/maptable/issues/56)
  - Improve heatmap marker handling - [Issue #54](https://github.com/Packet-Clearing-House/maptable/issues/54)
  - Fix heatmap filter but - [Issue #53](https://github.com/Packet-Clearing-House/maptable/issues/53)
  - Fix color bug on filters - [Issue #43](https://github.com/Packet-Clearing-House/maptable/issues/43)
  - Fix marker bug on filters - [Issue #41](https://github.com/Packet-Clearing-House/maptable/issues/41)
  - Add stateful URLs for filters, zoom and Lat/Long - [Issue #38](https://github.com/Packet-Clearing-House/maptable/issues/38)
  - Add secondary sort on columns - [Issue #37](https://github.com/Packet-Clearing-House/maptable/issues/37)
- Version 1.4.0 December 20 2016
  - Add heatmap feature - [PR #43](https://github.com/Packet-Clearing-House/maptable/pull/43)
  - Add client side export feature - [Issue #9](https://github.com/Packet-Clearing-House/maptable/issues/9)
  - Fixed country colors when filtering - [Issue #43](https://github.com/Packet-Clearing-House/maptable/issues/43)
  - Add callback feature - [Issue #25](https://github.com/Packet-Clearing-House/maptable/issues/25)
  - Add stateful URL feature - [Issue #38](https://github.com/Packet-Clearing-House/maptable/issues/38)
- Version 1.3 September 26 2016
  - Allow fancier math on country values in `map.countries.attr.fill.transform()` in GeoMap.js - [Issue #32](https://github.com/Packet-Clearing-House/maptable/issues/32)
- Version 1.2.1 September 21 2016
  - Fix bad use of `attrValue` in GeoMap.js - [Issue #30](https://github.com/Packet-Clearing-House/maptable/issues/30)
- Version 1.2 September 20 2016
  - Allow custom colors for negative values - [PR #29](https://github.com/Packet-Clearing-House/maptable/pull/29)
  - Correctly render legend markers - [Issue #27](https://github.com/Packet-Clearing-House/maptable/issues/27)
  - Fix `countries.attr` documentation add add new `minNegative` and `maxNegative` docs.
- Version 1.1.1 July 14 2016
  - Tweak sorting when clicking column headers - [PR #23](https://github.com/Packet-Clearing-House/maptable/pull/23)
  - Scrolling up when we click on New filter - [Issue #20](https://github.com/Packet-Clearing-House/maptable/issues/20)
  - Fix poor render on first load - [PR #22](https://github.com/Packet-Clearing-House/maptable/pull/22)
- Version 1.1 June 22 2016
  - IE11 works - [Issue #7](https://github.com/Packet-Clearing-House/maptable/issues/7)
  - multi-filter works - [Issue #15](https://github.com/Packet-Clearing-House/maptable/issues/15)
  - `gulp dist` to merger all prior work to dist - [Issue #18](https://github.com/Packet-Clearing-House/maptable/issues/18)
- Version 1.0.2 May 16 2016
  - Fix dev environment for Ubuntu - [Issue #11](https://github.com/Packet-Clearing-House/maptable/issues/11)
  - Restore `example` directory for use with development - [Issue #11](https://github.com/Packet-Clearing-House/maptable/issues/11)
  - Fix some npm packaging breakage - [Issue #11](https://github.com/Packet-Clearing-House/maptable/issues/11)
- Version 1.0.1 March 25 2016
  - First Full featured release
- Version 1.0.0 December 9 2014
  - Initial commit

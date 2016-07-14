MapTable
========

## Table of Contents
* [Introduction](#introduction)
* [Dependencies](#dependencies)
* [Declaring MapTable elements](#declaring-maptable-elements)
* [Import datasets](#import-datasets)
* [Map datasets](#map-datasets)
* [Declaring MapTable elements](#declaring-maptable-elements)
  * [Import datasets](#import-datasets)
  *	[Map datasets](#map-datasets)
  *	[Dataset requirements](#dataset-requirements)
  *	[Columns details](#columns-details)
    *		[columnsDetails format](#columnsdetails-format)
* [Naming conventions](#naming-conventions)
* [ScaledValue](#scaledvalue)
  *	[Map](#map)
    *		[Options](#options)
* [Filters](#filters)
  *	[Options](#options-1)
* [Table](#table)
  *	[Options](#options-2)
* [Export as SVG](#export-as-svg)
  *	[Credits](#credits)
* [Contribute](#contribute)
  * 	[Set up your development environment](#set-up-your-development-environment)
    * 		[Requirements](#requirements)
  * 	[Getting Started](#getting-started)
  * 	[Todo](#todo)
* [Release History](#release-history)


## Introduction

This library was originally conceived to render the [home page](https://pch.net) and next generation of [IXP directory](https://pch.net/ixpdir) for Packet Clearing House ([PCH](https://pch.net)). It's primary function is to convert any dataset to a customizable set of components of Map, Filters and Table:
- **Map** - A fully customizable SVG map which dynamically responds to filters and can be exported to a stand alone SVG for external consumption
- **Table** - A tabular representation of your dataset which can be sorted by header rows. This also dynamically responds to filters.
- **Filters** - A programmatically generated list of drop downs and input fields to drill down into your dataset

You can also browse other code samples and **examples** here:

[<img src="https://gist.githubusercontent.com/melalj/cc130ad4072a2f52a5aa/raw/2abcdff5cc84e71dd40552be68e5ae747dcd9a5d/thumbnail.png">](https://bl.ocks.org/melalj/cc130ad4072a2f52a5aa) [<img src="https://gist.githubusercontent.com/melalj/ef85eb677583647daf52/raw/127e36862c4cfae6e7039023a8a449cc043f6837/thumbnail.png">](https://bl.ocks.org/melalj/ef85eb677583647daf52) [<img src="https://gist.githubusercontent.com/melalj/2394323e478dca231128/raw/a43dadbb67e8ecb335a92f2210ae59f109f25fd6/thumbnail.png">](https://bl.ocks.org/melalj/2394323e478dca231128)

[<img src="https://gist.githubusercontent.com/melalj/772c8a846a3f308e9358/raw/b8b39512d91b56ce4383cfd5a491083ff3f1b42f/thumbnail.png">](https://bl.ocks.org/melalj/772c8a846a3f308e9358) [<img src="https://gist.githubusercontent.com/melalj/07be61a538509b8e4a7e/raw/5565adb3e2a88162c6ecaa55dc7472a085ddb0d2/thumbnail.png">](https://bl.ocks.org/melalj/07be61a538509b8e4a7e) [<img src="https://gist.githubusercontent.com/melalj/1aa4dd90b4561deb8de6/raw/dbb70a32eeba5c366b9a4c4641fb2d104a26f6cb/thumbnail.png">](https://bl.ocks.org/melalj/1aa4dd90b4561deb8de6)

## Dependencies

- [D3.js](https://d3js.org/)
- TopoJSON*: [homepage](https://github.com/mbostock/topojson) or [download (cdnjs)](https://cdnjs.com/#q=topojson)

\* Only used if you need a map

## <a name="render"></a>Install

Here is minimum amount of HTML to render a MapTable with Map, Filter and Table.

```html
<div id='vizContainer'></div>

<script src="d3.min.js"></script> <!-- You can import it from cdnjs.com or bower-->
<script src="topojson.min.js"></script> <!-- You can remove this line if you're not using the map --> <!-- You can import it from cdnjs.com or bower -->
<script src="maptable.min.js"></script> <!-- You can import it from cdnjs.com or bower -->
<script>
  var viz = d3.maptable('#vizContainer')
              .csv('/examples/data/ixp.csv')
              .map({ path: '/examples/maps/world-110m.json' }) // You can remove this line if you want to disable the map
              .filters() // You can remove this line if you want to disable filters
              .table() // You can remove this line if you want to disable the table
              .render(); // This is important to render the visualization
</script>
```
MapTable is available on cdnjs.com. Remember though, cool kids concatenate their scripts to minimize http requests.

If you want to style the MapTable elements with some existing styles, you can prepend the above HTML with:

```html
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
<link rel="stylesheet" href="/maptable.css">
```

## Declaring MapTable elements

To create a visualization (Map or/and Table or/and Filters) of your dataset, you need to provide first the container of your visualization

```html
<div id='vizContainer'></div>
```

The default order of the 3 components is `Map`, `Filters` and `Table`. If you want to place the components in a different order, you can put them on the main container:

```html
<div id='vizContainer'>
  <div id='mt-map'></div>
  <div id='mt-filters' class='panel panel-default'></div>
  <div id='mt-table'></div>
</div>
```

You instantiate the MapTable library into the `viz` variable based on the `#vizContainer` ID you declared in the DOM:

```html
<script>
  var viz = d3.maptable('#vizContainer'); // #vizContainer is the css selector that will contain your visualization
</script>
```

The MapTable `viz` declaration in the above example is a chain of functions. The possible functions that you can use are:
- [viz.json(jsonPath)](#viz-json) with `jsonPath` as string
- [viz.csv(csvPath)](#viz-csv) with `csvPath` as string
- [viz.tsv(tsvPath)](#viz-tsv) with `tsvPath` as string
- [viz.columns(columnDetails)](#columns-details) with `columnDetails` as a JS dictionary. You can add/remove it of you want to customize your columns or create virtual columns based on the data.
- [viz.map(mapOptions)](#map) with `mapOptions` as a JS dictionary. You can add/remove it of you want a map on your visualization.
- [viz.filters(filtersOptions)](#filters) with `filtersOptions` as a JS dictionary. You can add/remove it of you want filters on your visualization.
- [viz.table(tableOptions)](#table) with `tableOptions` as a JS dictionary. You can add/remove it of you want a table on your visualization.
- [viz.render()](#render) that closes the chain and renders the visualization. Don't forget this!


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
    {"longitude": "13.23000", "latitude": "-8.85000"},
    {"longitude": "168.32000", "latitude": "-17.75000"},
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
  {"country_code": "MAR", "Country Name": "Morocco", "bar": "foo"},
  {"country_code": "FRA", "Country Name": "France", "bar": "foo"},
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

*Example (adding `nowrap` and `type` to the `region` column key):*
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

## ScaledValue

We use this type to change the attributes of markers and countries.

It can be static value, for example a hex color for `countries.attr.fill = '#FFFFFF'`.

Or if the value of the attribute is depending on the data, the expected value would be an object as explained on the below example.

For example, if we want to have countries background color to be related to a scale from green to red, and be white if the country don't have any related data. The value of `countries.attr.fill` would be:

```js
{
  min: 'green', // Color for the minimum value
  max: 'red', // Color for the maximum value
  empty: 'white', // Color if no value is affected for that country or marker
  legend: true, // Works only for the countries.attr.fill at the moment (contributions are welcome)
  rollup: function (values) { // What is the value that we're attaching to the country / and attribute  
    // values is an array that contains rows that match that country or marker
    return values.length; // for example here the count of row, it could be also the mean, sum...
  }
}
```

If you want to attach the data boundaries to the value of an attribute, you may set as values for min and max as `minValue` and `maxValue`. For example, if we want to have markers radius to be related to a scale from minimum value and the maximum value, but also transform the value following a function. The value for the map options on `markers.attr.r` would be:

```js
{
  min: 'minValue',
  max: 'maxValue',
  transform: function (val) {
    return Math.sqrt(val);
  },
}
```


### Map

\#`viz.map(mapOptions)` with `mapOptions` as a JS dictionary. You can add/remove it of you want a map on your visualization.

#### Options

- `path:` _(string, **required**)_ URL of the TOPOJSON map, you can get them from Mike Bostock's repo: [world atlas](https://github.com/mbostock/world-atlas) and [us atlas](https://github.com/mbostock/us-atlas). Or use [this tool](https://github.com/melalj/topojson-map-generator) to generate these files as we did on the examples.
- `width:` _(integer, default:'window.innerWidth')_ Map Width.
- `height:` _(integer, default:'window.innerHeight')_ Map Height.
- `zoom:` _(bool, default: true)_ Enable zoom on the map (when scrolling up/down on the map).
- `title:` _(object, default: *see below*)_ Add a title within the map.
    - `title.bgColor:` _(string, default: '#000000')_ Title font size.
    - `title.fontSize:` _(integer, default: 12)_ Title font size.
    - `title.fontFamily:` _(string, default: 'Helevetica, Arial, Sans-Serif')_ Title font family.
    - `title.content:` _(function(countShown, countTotal, filtersDescription)_ Function to define how the title is rendered
    - `title.source:` _(function())__ Function to define how the HTML in the title.

*Example:*
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
- `exportSvg:` _(string, default: null)_ URL endpoint to download the current visualization as SVG. Read more on the section export SVG. (more details on a the section "Export as SVG")
- `watermark:` _(object, default: null)_ Add a watermark within the map.
    - `watermark.src:` _(string)_ URL of the image (svg, png, jpg).
    - `watermark.width:` _(integer)_ Image width.
    - `watermark.height:` _(integer)_ Image height.
    - `watermark.position:` _(string)_ Watermark position (top|middle|bottom) (left|middle|right). e.g. `bottom left`.
    - `watermark.style:` _(string)_ Additional css style for the watermark.

*Example:*
```js
watermark: {
  src: 'https://example.com/image.svg',
  width: 130,
  height: 60,
  position: "bottom left",
  style: "opacity:0.1"
},
```
- `markers:` _(object, default: null)_ Add markers on the map.
    - `markers.customTag:` _(function(markerObject)), default: null)_ This is more advanced feature. If you'd like to override the default market tag (svg:circle) to something different (like an image), you can use this callback function to append to the markerObject your custom implementation (see below example). x and y are coordinates in pixels of the marker.
    - `markers.attrX:` _(string, default: 'cx')_ Attribute to position the marker on the X-Axis
    - `markers.attrY:` _(string, default: 'cy')_ Attribute to position the marker on the Y-Axis
    - `markers.attrXDelta:` _(integer, default: 0)_ Left relative margin of the marker
    - `markers.attrYDelta:` _(integer, default: 0)_ Top relative margin of the marker
    - `markers.tooltipClassName:` _(string, default: 'mt-map-tooltip popover bottom')_ Class name of the tooltip used for markers (we're using bootstrap).
    - `markers.tooltip:` _(function(groupedData))_ Function that returns html that we would use as content for the tooltip. We recommend you to use the bootstrap popover..
    - `markers.attr:` _(object)_ Markers attributes (same naming as SVG attributes).
        - `markers.attr.fill:` _(ScaledValue)_ Marker background color.
        - `markers.attr.r:` _(ScaledValue)_ Marker radius.
        - `markers.attr.stroke:` _(ScaledValue)_ Marker border color.
        - `markers.attr.stroke-width:` _(ScaledValue)_ Marker border width.

*Example (grouping by value):*

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
    r: {
      min: "minValue",
      max: "maxValue",
      transform: function(v) {
        return 3 * Math.sqrt(v);
      },
      rollup: function(values) {
        return values.length;
      },
    },
    fill: "yellow",
    stroke: "#d9d9d9",
    "stroke-width": 0.5
  }
},
```
*Example (with custom tag - Advanced feature):*


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

- `countries:` _(object, default: null)_ Add countries on the map.
    - `countries.rollup:` _(function(groupedData))_ Function that returns a value that we would use for every country.
    - `countries.tooltip:` _(function(groupedData))_ Function that returns html that we would use as content for the tooltip. We recommend you to use the bootstrap popover. The parameter is `groupedData` (check above on the naming conventions for more details).
    - `countries.attr:` _(object)_ Markers attributes (same naming as svg attributes).
            - `countries.attr.fill:` _(ScaledValue)_ Marker background color.
            - `countries.attr.r:` _(ScaledValue)_ Marker radius.
            - `countries.attr.stroke:` _(ScaledValue)_ Marker border color.
            - `countries.attr.stroke-width:` _(ScaledValue)_ Marker border width.

*Example*

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
      rollup: function(values) {
        return values.length;
      },
    },
    stroke: "#d9d9d9",
    "stroke-width": 0.5
  },
},
```

## Filters

\# `viz.filters(options)` with `filtersOptions` as a JS dictionary. You can add/remove it of you want filters on your visualization.

### Options

- `show:` _([string, ...], default: null)_ Set the order and the columns that we want to see in the filters.

## Table

If you want to add a table on your visualization:

\# `viz.table(tableOptions)` with `tableOptions` as a JS dictionary. You can add/remove it of you want a table on your visualization.

### Options

- `show:` _([string, ...], default: null)_ Set the order and the columns that we want to see in the table.
- `className:` _(string, default: 'table table-striped table-bordered')_ Table class name
- `rowClassName:` _(function(d), default: null)_ Function that returns the row class name depending on its content. Useful to highlight rows.
- `defaultSorting:` _(object, default: see below)_ How we sort things on the table.
    - `defaultSorting.key:` _(string, default: <first column shown>)_ default sorting on which column.
    - `defaultSorting.mode:` _(string, default: 'asc')_ sorting mode: `asc` for ascending, `desc` for descending.
- `collapseRowsBy:` _([string, ...], default: null)_ Array of columns that we want to be collapsed.

## Export as SVG

You can enable this feature to allow users download the map on their computer as SVG. However, you would need to set up a server endpoint that is going to allow users download the SVG file.

The sample code for a PHP server is located in `/server/exportSvg.php`. Contributions are welcomed for implementations of in other languages.

## Credits

  * Mohammed Elalj [@melalj](https://github.com/melalj) - Author, Architect, JS Guru
  * Ashley Jones [@Ths2-9Y-LqJt6](https://github.com/Ths2-9Y-LqJt6) - Feature Requester, QA, Love, Release Engineer

## Contribute

You are welcomed to fork the project and make pull requests.

### Set up your development environment

#### Requirements

Install any items with "sudo":

- [NodeJs](http://www.nodejs.org), type `npm -v` on your terminal to check if you have it.  node.js 4 and npm 2 versions or higher required. 
- Gulp `sudo npm install -g gulp`
- Bower `sudo npm install -g bower`

#### Getting Started

Run these commands as your unprivileged user you're doing your development as:

1. Run `npm install` to install dependencies
1. Run `bower install` to download Browser Javascript libraries
1. Run `gulp` to start the local dev environment on [http://localhost:5000](http://localhost:5000)
1. Edit files in `./dev` and they will be automatically compiled to `./src`
1. To have production ready files, run: `gulp dist`. All built files are located in the folder `./dist`
1. Enjoy 🍻

### Todo

 * [x] Publish v1
 * [ ] Write unit tests 🙏
 * [ ] Improve documentation (spell, formulation, emoji...)
 * [ ] Secondary sorting
 * [ ] Append SVG filters to the map and use them as styling
 * [ ] Legend gradient transformation (if we used the log scale)
 * [ ] Have multiple legends depending on the attribute
 * [ ] Legend marker radius


## Release History
* Version 1.1.1 July 14 2016
  * Tweak sorting when clicking column headers - PR [#23](https://github.com/Packet-Clearing-House/maptable/pull/23)
  * Scrolling up when we click on New filter - Issue [#20](https://github.com/Packet-Clearing-House/maptable/issues/20)
  * Fix poor render on first load - PR [#22](https://github.com/Packet-Clearing-House/maptable/pull/22)
* Version 1.1 June 22 2016
  * IE11 works - Issue [#7](https://github.com/Packet-Clearing-House/maptable/issues/7)
  * multi-filter works - Issue [#15](https://github.com/Packet-Clearing-House/maptable/issues/15)
  * ``gulp dist`` to merger all prior work to dist - Issue [#18](https://github.com/Packet-Clearing-House/maptable/issues/18)
* Version 1.0.2 May 16 2016
  * Fix dev environment for Ubuntu - Issue [#11](https://github.com/Packet-Clearing-House/maptable/issues/11)
  * Restore ``example`` directory for use with development - Issue [#11](https://github.com/Packet-Clearing-House/maptable/issues/11)
  * Fix some npm packaging breakage - Issue [#11](https://github.com/Packet-Clearing-House/maptable/issues/11)
* Version 1.0.1 Mar 25 2016
  * First Full featured release
* Version 1.0.0
  * Initial commit
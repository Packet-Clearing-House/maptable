MapTable
========

Convert any dataset to a customizable set of components (Map, Filters, Table).

# Documentation

## Dependencies

- MapTable requires [D3.js](https://d3js.org/) to work.
- If you're expecting to use the `map` capability, you would also need to require [TopoJSON](https://github.com/mbostock/topojson).

## Import MapTable in your project

### Browser

```html
<script src="d3.min.js"></script>
<script src="topojson.min.js"></script>
<script src="maptable.min.js"></script>
<script>
  d3.maptable('#vizContainer')
    .json('http://foo.com/dataset.json')
    .map(...)
    .filters(...)
    .table(...);
</script>
```
MapTable is available on cdnjs.com. Remember though, cool kids concatenate their scripts to minimize http requests.

### Bower

```shell
bower install --save maptable
```
Notable files are: `build/maptable.min.js` `build/maptable.css`

## Usage

## Naming conventions

For clarity, we define `viz` as the variable that instantiate Maptable.

Functions that have `d` as parameter, means that `d` is a dictionary that contain data for one row.

Functions that have `groupedData` as parameter, means that `groupedData` is a dictionary `{ key: 'groupedByKey', values: [ {...d...} ] }` that contain grouped data.


## Initiate MapTable

You would need to provide the container of your visualization
```html
<div id='vizContainer'></div>

<script>
  var viz = d3.maptable('#vizContainer'); // #vizContainer is the css selector that will contain your visualization
</script>
```

If you want to place the component `Map`, `Filters`, `Table` in a different order, you can put them on the main container:

```html
<div id='vizContainer'>
  <div id='mt-map'></div>
  <div id='mt-filters'></div>
  <div id='mt-table'></div>
</div>
```

### Import datasets

\# `viz.json(url)`

Import JSON file at the specified url with the mime type "application/json".

\# `viz.csv(url)`

Import CSV file at the specified url with the mime type "text/csv".

\# `viz.tsv(url)`

Import TSV file at the specified url with the mime type "text/tab-separated-values".

### Columns details

By default, MapTable imports all the columns and detects its format automatically. But you can customize behaviors of specific columns and even create new virtual columns.

\# `viz.columns(columnsDetails)`

#### columnsDetails format

- `<PUT_YOUR_COLUMN_KEY>:` _(Object)_ Provide the columns key here to provide its information below:

  - `nowrap:` _(bool, default: false)_ When present, it specifies that the content inside a that column should not wrap.

  - `title:` _(string, default: columnKey)_ What we show as column name in filters and table.

  - `type:` _(string, default: 'field')_ Column format type, used for filtering. Available options:

    - `field`: filter by keyword
    - `dropdown`: exact match using a dropdown
    - `number`: filter using comparison (≥, ≤, between ....)
    - `custom`: custom format that we will define with the option `dataFormat`

  - `dataFormat:` _(function(d))_ Used only when `type` is _custom_. Function that return the new formatted data.

  - `cellContent:` _(function(d))_ Function that return what we will show on the table cell. 

### Map

If you want to add a Map on your visualization:

\# `viz.map(options)`

#### Options

- `path:` _(string, required)_ URL of the TOPOJSON map, you can get them from Mike Bostock's repo: [world atlas](https://github.com/mbostock/world-atlas) and [us atlas](https://github.com/mbostock/us-atlas).

- `zoom:` _(bool, default: true)_ Enable zoom on the map (when scrolling up/down on the map).

- `legend:` _(bool, default: false)_ Enable map legend (that would show the color scale with extremums).

- `title:` _(object, default: *see below*)_ Add a title within the map.

  - `title.fontSize:` _(integer, default:12)_ Title font size.

   - `title.fontFamily:` _(string, default: 'Helevetica, Arial, Sans-Serif')_ Title font family.

- `scaleZoom:` _([integer, integer], default: [1, 10])_ The map zoom scale extremums.

- `scaleHeight:` _(float, default: 1.0)_ Ratio to scale the map height.

- `autoFitContent:` _(bool, default: true)_ Enable auto zoom to focus on the active markers.

- `fitContentMargin:` _(integer, default: 10)_ Padding in pixels to leave when we filter on a specific area.

- `tooltipClass:` _(string, default: 'popover bottom')_ Class name of the tooltip (we're using bootstrap).

- `ratioFromWidth:` _(float, default: 0.5)_ Ratio between the height and the width: height/width, used to deduce the height from the the width.

- `longitudeKey:` _(string, default: 'longitude')_ Column name of the longitude (from the dataset).

- `latitudeKey:` _(string, default: 'latitude')_ Column name of the latitude (from the dataset).

- `exportSvg:` _(string, default: null)_ URL endpoint to download the current visualization as SVG. Read more on the section export SVG.

- `watermark:` _(object, default: null)_ Add a watermark within the map.

  - `watermark.src:` _(string)_ URL of the image (svg, png, jpg).

  - `watermark.width:` _(integer)_ Image width.

  - `watermark.height:` _(integer)_ Image height.

  - `watermark.position:` _(string)_ Watermark position (top|middle|bottom) (left|middle|right). e.g. `bottom left`.

  - `watermark.style:` _(string)_ Additional css style for the watermark.

- `markers:` _(object, default: null)_ Add markers on the map

  - `markers.groupBy:` _(function(d))_ Function that returns a string that we use to group markers on the dataset. Example: `function(d) { return d.city + ', ' + d.country; }`

  - `markers.rollup:` _(function(groupedData))_ Function that returns a value that we would use for every marker. We will use it to set the radius of the markers. Example: `function(values) { return values.length; }`

  - `markers.tooltip:` _(function(d))_ Function that returns html that we would use as content for the tooltip. We recommend you to use the bootstrap popover. If we using groupBy, the parameter is going to be `groupedData`, otherwise it's `d` (check above on the naming conventions for more details).

  - `markers.attr:` _(object)_ Markers attributes (same naming as svg attributes)

    - `markers.attr.fill:` _(ScaledValue)_ Marker background color

    - `markers.attr.r:` _(ScaledValue)_ Marker radius

    - `markers.attr.stroke:` _(ScaledValue)_ Marker border color

    - `markers.attr.stroke-width:` _(ScaledValue)_ Marker border width

- `countries:` _(object, default: null)_ Add countries on the map

  - `countries.groupBy:` _(function(d))_ Function that returns a string that we use to group row by countries on the dataset. Example: `function(d) { return d.country_code; }`

  - `countries.rollup:` _(function(groupedData))_ Function that returns a value that we would use for every country. Example: `function(values) { return values.length; }`

  - `countries.tooltip:` _(function(d))_ Function that returns html that we would use as content for the tooltip. We recommend you to use the bootstrap popover. If we using groupBy, the parameter is going to be `groupedData`, otherwise it's `d` (check above on the naming conventions for more details).

  - `countries.attr:` _(object)_ Markers attributes (same naming as svg attributes)

    - `countries.attr.fill:` _(ScaledValue)_ Marker background color

    - `countries.attr.r:` _(ScaledValue)_ Marker radius

    - `countries.attr.stroke:` _(ScaledValue)_ Marker border color

    - `countries.attr.stroke-width:` _(ScaledValue)_ Marker border width


### Filters

If you want to add filters on your visualization:

\# `viz.filters(options)`

#### Options

- `show:` _([string, ...], default: null)_ Set the order and the columns that we want to see in the filters


# Contribute

You are welcomed to fork the project and make pull requests.

## Todo

 * [ ] Write unit tests
 * [ ] Improve documentation

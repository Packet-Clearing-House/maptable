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

For clarity, we define `viz` as the variable that instantiate Maptable.

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

\# viz.*json*(url)

Import JSON file at the specified url with the mime type "application/json".

\# viz.*csv*(url)

Import CSV file at the specified url with the mime type "text/csv".

\# viz.*tsv*(url)

Import TSV file at the specified url with the mime type "text/tab-separated-values".

### Map

\# viz.*map*(options)

#### Options

- `path:` _(string, required)_ URL of the TOPOJSON map, you can get them from Mike Bostock's repo: [world atlas](https://github.com/mbostock/world-atlas) and [us atlas](https://github.com/mbostock/us-atlas).

- `zoom:` _(bool, default: true)_ Enable zoom on the map (when scrolling up/down on the map).

- `legend:` _(bool, default: false)_ Enable map legend (that would show the color scale with extremums).

- `title:` _(object, default: *see below*)_ Add a title within the map.

  - `title.fontSize:` _(integer, default:12)_ Title font size

   - `title.fontFamily:` _(string, default: 'Helevetica, Arial, Sans-Serif')_ Title font family

- `scaleZoom:` _([integer, integer], default: [1, 10])_ The map zoom scale extremums

- `scaleHeight:` _(integer, default: 1)_ Ratio to scale the map height

- `autoFitContent:` _(bool, default: true)_ Enable auto zoom to focus on the active markers

- `fitContentMargin:` _(integer, default: 10)_ Padding in pixels to leave when we filter on a specific area.

- `tooltipClass:` _(string, default: 'popover bottom')_ Class name of the tooltip (we're using bootstrap).


# Contribute

You are welcomed to fork the project and make pull requests.

## Todo

 * [ ] Write unit tests
 * [ ] Improve documentation

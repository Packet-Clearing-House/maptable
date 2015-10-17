Maptable
========

(Work In Progress)

Provide a CSV or JSON and the tool will plot a world Map with locations of the table rows, with filters and a table

# API documentation

## Init a MapTable

`MapTable.init("target selector", {options});

## Options
You can build different components of the tool just by mentioning it on the options

### Data
It's a mandatory tool, and contains details about the dataset:

```
data: {
  type: "csv|json",
  path: "path/to/data/file", // path to your JSON or CSV file
  columns: [
    {
      id: "foo", // column name in the input file
      displayName: "Foo", // how you want to display it on the header
      type: "dropdown|field|number|virtual|custom", // Used for filter, it how you want to filter data:
                                // Dropdown: Select within a list of unique occurrences
                                // Field: Input a string to filter rows that contains this text
                                // Number: Same as above, but for numbers (uses <input type="number">)
                                // Virtual: Not included in the filters, used for button actions
                                // Custom: will get the input type from the option input_type
      input_type: "data|range|tel...", // Input type for the filter, check the previous comment
      cellContent: function(d) { ... }, // How you want to format the cell on the table
      dataFormat: function(d) { ... }, // If the data have to be converted before working with it
    }
  ]
}
```

### Map

```
map: {
  path: "path/to/topojson/file", // Path to topojson file
  auto_width: true
  zoom: true,
  scale_height: .86,
  ratio_from_width: .48,
  watermark: {
    src: "path/to/watermark/image",
    width: 130,
    height: 60,
    position: "bottom left",
    style: "opacity:0.1"
  },
  title: {
    bgcolor: "#F5F5F5",
    font_size: "11",
    content: function(countRowsFiltered, countTotalRows, filtersInline) { ... },
    source: "source text"
  },
  svg_filters: "#svg_filters", // Selector for SVG filters (check example)
  markers: {
    group_by: function(d) {
      return d.city + ", " + d.country;
    },
    rollup: function(d) {
      return d.length;
    },
    tooltip: function(a) {
      out = '<div class="arrow"></div>';
      out += '<span class="badge pull-right"> ' + a.values.length + '</span><h3 class="popover-title"> ' + a.key + '</h3>';
      out += '<div class="popover-content">';

      for (i = 0; i < a.values.length; i++) out += " • " + a.values[i].long_name + "<br>";

      out += "</div>";
      return out;
    },
    attr: {
      r: ["min", "max", function(a) {
        return 3 * Math.sqrt(a);
      }],
      fill: "url(#gardientYellow)",
      stroke: "#d9d9d9",
      "stroke-width": .5,
      filter: "url(#drop-shadow)"
    }
  },
  countries: {
    group_by: function(a) {
      return a['country_code'];
    },
    rollup: function(a) {
      return a.length;
    },
    attr: {
      fill: ["#a9b6c2", "#6c89a3"],
      stroke: "#d9d9d9",
      "stroke-width": .5
    },
    attr_empty: {
      fill: "#f9f9f9"
    }
  }
},
```

### Table

```
table: {
  rowClassName: function(a) {
    if (a.status != "Active") return "inactive";
    return "";
  },
  class: "table table-striped",
  default_sorting: {
    id: "city",
    mode: "asc"
  },
  collapse_rows_by: ["region", "country", "city"]
}
```

# Contribute

You are welcomed to fork the project and make pull requests.
Be sure to create a branch for each feature!

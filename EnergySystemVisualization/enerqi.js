/**
 * Created by Claude on 05.05.2015.
 */

var enerqi = {
    version: "0.1"
};

/**
 * The grid in which all scenarios are held. Constructs a grid when called. Needs a div element with class attribute
 * 'gridster'.
 */
enerqi.grid = function() {
    var grid = {};

    // Set how many scenarios should be displayed side-by-side.
    var nrOfDiagrams = 0;

    var maxCols = 2;
    var maxRows = 2;
    var maxDiagrams = maxCols * maxRows;
    var minNodeWidth = 10;
    var minWidgetWidth = 300;
    var headerHeight = 20; // XXX statically defined in css class 'header.drag-handle'.
    var sliderHeight = 100;
    var widgetMargin = 30;
    var widgetWidth = (window.innerWidth / maxCols) - (widgetMargin * (maxCols + 1));
    if (widgetWidth < minWidgetWidth) widgetWidth = minWidgetWidth;
    var widgetHeight = (window.innerHeight / maxRows) - (widgetMargin * (maxRows + 1));
    var diagramWidth = widgetWidth;
    var diagramHeight = widgetHeight - headerHeight - sliderHeight;
    var nodeWidth = minNodeWidth * widgetWidth/minWidgetWidth;
    /**
     * the list of the scenarios in use
     */
    var scenarios = {};
    var gridster;

    grid.scenarios = function() {
        return scenarios;
    };

    setUpGrid();

    /**
     * Creates and adds a scenario to the grid. Currently the DOM parts of the scenario are the draggable header,
     * the svg element which holds the sankey diagram and a div element which holds the slider.
     */
    grid.addScenario = function() {
        /**
         * Sets up a widget and adds it to the gridster grid. Add more elements to a widget here (like a parameter
         * list element).
         */
        function addWidget(scenarioId) {
            var newDiv = document.createElement("div");
            var widgetObject = gridster.add_widget(newDiv);
            newDiv = d3.select(newDiv)
                .attr("id", scenarioId);
            newDiv.append("header")
                .style("height", headerHeight + "px")
                .style("background", "deeppink");
            newDiv.append("svg").attr("class", "chart");
            newDiv.append("div").attr("class", "slider");
            return widgetObject;
        }

        if (nrOfDiagrams < maxDiagrams) {
            var scenario = enerqi.scenario();
            scenario.id("scenario" + nrOfDiagrams++);
            scenarios[scenario.id()] = scenario;

            scenario.widgetRoot(addWidget(scenario.id())[0]);
            scenario.createSankey(nodeWidth, diagramWidth, diagramHeight);
            scenario.createTimeSlider();
        } else {
            alert("can't create more scenarios");
            return grid;
        }
    };

    function setUpGrid() {
        gridster = $(".gridster").gridster({
            widget_margins: [widgetMargin, widgetMargin],
            widget_base_dimensions: [widgetWidth, widgetHeight],
            max_cols: maxCols,
            widget_selector: 'div',
            draggable: {
                handle: 'header'
            },
            //resize: {
            //    enabled: true,
            //    stop: function(e, ui, widget) {
            //        var newWidth = this.resize_coords.data.width;
            //        var newHeight = this.resize_coords.data.height - headerHeight - sliderHeight;
            //        // Select the svg element of the resized widget.
            //        d3.select(widget[0])
            //            .select(".chart")
            //            .attr("width", newWidth)
            //            .attr("height", newHeight);
            //        // Select the sankey object corresponding to the widgets id.
            //        var sankey = scenarios[d3.select(widget[0]).attr("id")].sankey();
            //        sankey.size([newWidth, newHeight]);
            //        sankey.nodeWidth(minNodeWidth * newWidth / minWidgetWidth);
            //        sankey.relayout(300);
            //        sankey.redrawDiagram();
            //    }
            //}
        }).data('gridster');
    }

    return grid;
};

enerqi.scenario = function () {
    var scenario = {},
        currentYear,
        sankey,
        widgetRoot,
        id;

    scenario.widgetRoot = function (_) {
        if (!arguments.length) return widgetRoot;
        widgetRoot = _;
        return scenario;
    };

    scenario.currentYear = function (_) {
        if (!arguments.length) return currentYear;
        currentYear = _;
        return scenario;
    };

    scenario.id = function (_) {
        if (!arguments.length) return id;
        id = _;
        return scenario;
    };

    scenario.sankey = function (_) {
        if (!arguments.length) return sankey;
        sankey = _;
        return scenario;
    };

    scenario.createSankey = function (nodeWidth, diagramWidth, diagramHeight) {
        sankey = enerqi.sankey()
            .nodeWidth(nodeWidth)
            .nodePadding(30)
            .size([diagramWidth, diagramHeight])
            .widgetRoot(widgetRoot);

        sankey.createDiagram();
        return scenario;
    };

    scenario.createTimeSlider = function() {
        getYearsAvailable(createTimeSlider);
        function createTimeSlider(years) {
            d3.select(widgetRoot).select('.slider').call(
                d3.slider()
                    .axis(d3.svg.axis().orient("bottom").tickFormat(d3.format()).tickPadding(10))
                    .min(years[0])
                    .max(years[years.length - 1])
                    // XXX if there's not a data point for every year, this must be replaced by the exact years that the
                    // backend provided.
                    .step(1)
                    .on("slide", function (event, value) {
                        loadEnergyData(value, sankey.updateDiagram);
                        currentYear = value;
                    })
            );
        }
    };

    // Server-side functionality for this is not working
    scenario.exportSankeyAsPNG = function() {
        var serverUrl = "http://localhost:8888/energysysvis/exportSVG.php";
        var iframeId = "iframeId";     // Change this to fit your code
        // Create new iframe
        var iframe = $('<iframe src=""' + serverUrl + '"" name="' + iframeId + '" id="' + iframeId + '"></iframe>')
            .appendTo(document.body)
            .hide();
        // Create input
        var input = '<input type="hidden" name="data" value="' + encodeURIComponent($(widgetRoot).find("svg").prop('outerHTML')) + '" />';
        // Create form to send request
        $('<form action="' + serverUrl + '" method="' + 'POST' + '" target="' + iframeId + '">' + input + '</form>')
            .appendTo(document.body)
            .submit()
            .remove();
    };

    scenario.exportState = function() {

    };

    return scenario;
};

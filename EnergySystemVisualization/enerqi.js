/**
 * Created by Claude on 05.05.2015.
 */
var enerqi = {
    version: "0.1"
};

var ASPECT = 1.8;
var MAX_SCENARIOS = 4;
var MIN_NODE_WIDTH = 10;
var MIN_SCENARIO_WIDTH = 300;
var SLIDER_HEIGHT = 100;
var SCENARIO_MARGIN = 30;
var NODE_PADDING = 20;

/**
 * The grid in which all scenarios are held. Constructs a grid when called. Needs a div element with class attribute
 * 'gridster'.
 */
enerqi.grid = function() {
    var grid = {};

    var nrScenarios = 1;
    var scenarioId = 0;
    var headerHeight = 20; // XXX statically defined in css class 'header.drag-handle'. Replace by smaller area on scenario.

    var nrCols;
    var scenarioWidth;
    var scenarioHeight;
    // Calculate the best layout for the chosen number of scenarios
    if (nrScenarios == 1) {
        nrCols = 1;
        scenarioWidth = window.innerWidth - SCENARIO_MARGIN*2;
        if (scenarioWidth/ASPECT > window.innerHeight) {
            scenarioHeight = window.innerHeight - SCENARIO_MARGIN*2;
            scenarioWidth = scenarioHeight * ASPECT - SCENARIO_MARGIN*2;
        } else {
            scenarioHeight = scenarioWidth/ASPECT - SCENARIO_MARGIN*2;
        }
    } else if (nrScenarios == 2) {
        if (window.innerWidth/window.innerHeight > ASPECT) {
            // scnecarios will be in one row
            nrCols = 2;
            scenarioWidth = window.innerWidth/2 - SCENARIO_MARGIN*3;
            if (scenarioWidth/ASPECT > window.innerHeight) {
                scenarioHeight = window.innerHeight - SCENARIO_MARGIN*2;
                scenarioWidth = scenarioHeight * ASPECT - SCENARIO_MARGIN*3;
            } else {
                scenarioHeight = scenarioWidth/ASPECT - SCENARIO_MARGIN*2;
            }
        } else {
            // scenarios will be in one column
            nrCols = 1;
            scenarioWidth = window.innerWidth - SCENARIO_MARGIN * 2;
            if (scenarioWidth / ASPECT * 2 > window.innerHeight) {
                scenarioHeight = window.innerHeight / 2 - SCENARIO_MARGIN * 3;
                scenarioWidth = scenarioHeight * ASPECT - SCENARIO_MARGIN * 2;
            } else {
                scenarioHeight = scenarioWidth / ASPECT - SCENARIO_MARGIN * 3;
            }
        }
    } else if (nrScenarios > 2) {
        nrCols = 2;
        scenarioWidth = window.innerWidth/2 - SCENARIO_MARGIN*3;
        if (scenarioWidth/ASPECT*2 > window.innerHeight) {
            scenarioHeight = window.innerHeight/2 - SCENARIO_MARGIN*3;
            scenarioWidth = scenarioHeight * ASPECT - SCENARIO_MARGIN*3;
        } else {
            scenarioHeight = scenarioWidth/ASPECT - SCENARIO_MARGIN*3;
        }
    }
    //if (< minWidgetWidth) widgetWidth = minWidgetWidth;
    var diagramWidth = scenarioWidth;
    var diagramHeight = scenarioHeight - headerHeight - SLIDER_HEIGHT;
    var nodeWidth = scenarioWidth/30;
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

            var scenario = enerqi.scenario();
            scenario.id("scenario" + scenarioId++);
            scenarios[scenario.id()] = scenario;

            scenario.widgetRoot(addWidget(scenario.id())[0]);
            scenario.createSankey(nodeWidth, diagramWidth, diagramHeight);
            scenario.createTimeSlider();
    };

    function setUpGrid() {
        gridster = $(".gridster").gridster({
            widget_margins: [SCENARIO_MARGIN, SCENARIO_MARGIN],
            widget_base_dimensions: [scenarioWidth, scenarioHeight],
            max_cols: nrCols,
            widget_selector: 'div',
            draggable: {
                handle: 'header'
            }
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
            .nodePadding(NODE_PADDING)
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

    return scenario;
};

/*
 * Copyright (c) 2013 - 2015 Olivia Kaufmann & Claude Mueller
 * Copyright (c) 2013 - 2015 FHNW & ETH Zurich
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *  Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *  Neither the name of FHNW / ETH Zurich nor the names of its contributors may
 *   be used to endorse or promote products derived from this software without
 *   specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* The following software uses the javascript frameworks below, all of which are
 * distributed under the MIT or BSD license:
 * - d3.js, data-oriented javascript framework, http://d3js.org/
 * - Sankey plugin for d3.js (modified), http://bost.ocks.org/mike/sankey/, by Mike Bostock, which is based on the
 *   initial version http://tamc.github.io/Sankey/ by Thomas Counsell.
 * - d3.slider.js, a slider control using d3.js (modified), https://github.com/sujeetsr/d3.slider by Sujeet Sreenivasan
 * - jquery.gridster.js, a jQuery plugin for building grid layouts, http://gridster.net/, by Ducksboard
 * - jquery.js, http://jquery.com/
 * - bootstrap, framework for developing responsive, mobile first projects on the web, http://getbootstrap.com/
 */


var EnergyTool = EnergyTool || {version: "0.1"};

/**
 * Sets up and returns the grid object. The grid is the container of scenarios. It is used to add scenarios to it, to
 * create and show it in the DOM, with all its contents, or to clear it.
 * @returns {Object} the grid object
 */
EnergyTool.grid = function() {
    var MAX_HEADER_HEIGHT = 20;
    var MAX_SCENARIO_MARGIN = 40;
    // Ratios used for calculating the sizes of scenario components like the sankey diagram or the control buttons.
    var RATIOS = {
        // these first for need to add up to 1
        SLIDERHEIGHT : 0.1,
        DIAGRAMHEIGHT : 0.825,
        CONTROLSSIZE : 0.05,
        GLYPHICONSIZE : 0.025,

        // Aspect ratio is hardcoded, since the sankey diagrams are best displayed in approximately this ratio.
        ASPECT : 1.8,
        TEXTSIZE : 0.02
    };

    // Prevent user from mistakenly reload page and lose all scenario settings.
    window.onbeforeunload = function() {
        return "Your current session will be lost on reload!";
    };

    /**
     * The actual grid Object, that is returned on calling the EnergyTool.grid() function.
     * @type {Object}
     */
    var grid = {};
    /**
     * Number of scenarios in the current session.
     * @type {number}
     */
    var nrScenarios = 0;
    /**
     * The number of columns of the grid. Changes depending on screen size and number of scenarios.
     * @type {number}
     */
    var nrCols = 0;

    /**
     * Sizes and margins of each scenario. All scenarios have same sizes for better comparability.
     */
    var scenarioWidth,
        scenarioHeight,
        scenarioMargin;

    var diagramWidth,
        diagramHeight;

    var sliderHeight,
        sliderWidth;

    var controlsSize,
        glyphiconSize;

    /**
     * The list of the scenarios in use.
     * @type {Array}
     */
    var scenarios = [];

    /**
     * The Gridster object.
     */
    var gridster;

    // XXX textSize should be adjustable.
    var textSize = 12;

    /**
     * Removes the grid's DOM and sets the gridster object to null.
     * @returns {Object} this grid
     */
    grid.clear = function() {
        gridster = null;
        d3.select(".gridster").remove();
        return grid;
    };

    /**
     * Calculates sizes depending on number of scenarios. Creates css styling rule for the calculated text size for the
     * whole document. Creates the DOM elements for the grid and it's cells. Calls the creation of the scenario's sankey
     * and time slider.
     * @returns {Object} this grid
     */
    grid.create = function() {
        calculateSizes();

        // Create a styling that sets the font size for the whole document and the styling of the glyphs used in the
        // controls.
        var style = document.getElementById("style-for-text-size");
        if (!style) {
            style = document.createElement('style');
            style.id = "style-for-text-size";
            style.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        style.innerHTML = 'text { font-size: ' + textSize + 'px; }' +
            '.glyphicon { font-size:' + glyphiconSize + 'px; ' +
            ' display: block; top: 0px; }';


        // Create new div for the gridster to live in, if none present.
        if (d3.select(".gridster").empty()) {
            d3.select("body").append("div")
                .attr("class", "gridster")
                .style("margin-left", "auto")
                .style("margin-right", "auto");
        }

        // Set up the gridster object.
        gridster = $(".gridster").gridster({
            widget_margins: [scenarioMargin, scenarioMargin],
            widget_base_dimensions: [scenarioWidth, scenarioHeight],
            max_cols: nrCols,
            widget_selector: 'div'
        })
            .data('gridster')
            .disable();

        // Async call to get the maximum sink value needed to initialize the sankey diagram correctly.
        getMaxSinkValue(callback);

        return grid;

        /**
         * Creates grid cells for every scenario and creates all the parts in it (sankey, time slider).
         * @param maxSinkValue the value of the sink with the maximum vlaue that appears in the energy data (calculated
         * in the backend)
         */
        function callback(maxSinkValue) {
            for (var i = 0; i < nrScenarios; i++) {
                var widget = addCell(i)[0];
                scenarios[i].gridCellDOM(widget);
                scenarios[i].createSankey(diagramWidth, diagramHeight, textSize, maxSinkValue);
                scenarios[i].createTimeSlider(sliderWidth, sliderHeight, textSize);
            }
        }

        /**
         * Creates and adds a new cell to the gridster grid.
         * @param i the ID of the scenario for which to create the new grid cell.
         * @returns {HTMLElement} the newly created grid cell
         */
        function addCell(i) {
            var widgetDiv = $("<div id=" + i + "/>").appendTo(".gridster");
            var widget = gridster.add_widget(widgetDiv);
            widgetDiv = d3.select(widgetDiv[0]);
            var controlsDiv = widgetDiv.append("div")
                .style("text-align", "right")
                .style("padding-right", "5%");

            controlsDiv.append("button")
                .attr("type", "button")
                .attr("aria-label", "Left Align")
                .attr("class", "btn btn-default btn-sm")
                .style("margin", "5px")
                .style("height", controlsSize + "px")
                .style("width", controlsSize + "px")
                .on("click", function() {
                    grid.copyScenario(i);
                })
                .append("span")
                .attr("class", "glyphicon glyphicon-duplicate")
                //.style("left", "-5px")
                .attr("aria-hidden", "true");

            controlsDiv.append("button")
                .attr("type", "button")
                .attr("aria-label", "Left Align")
                .attr("class", "btn btn-default btn-sm")
                .style("margin", "5px")
                .style("height", controlsSize + "px")
                .style("width", controlsSize + "px")
                .on("click", function() {
                    grid.removeScenario(i);
                })
                .append("span")
                .attr("class", "glyphicon glyphicon-trash")
                .attr("aria-hidden", "true");
            widgetDiv.append("svg").attr("class", "sankey");
            widgetDiv.append("div").attr("class", "timeslider");

            return widget;
        }

        /**
         * Calculate the appropriate layout for the current number of scenarios and the given screen size.
         * Function allows four scenarios to fit into the window. If more scenarios are added they are appended below
         * the existing four and scrolling is required to display them.
         */
        function calculateSizes() {
            if (nrScenarios <= 1) {
                scenarioMargin = MAX_SCENARIO_MARGIN;
                nrCols = 1;
                scenarioWidth = window.innerWidth - scenarioMargin*2;
                if (scenarioWidth/RATIOS.ASPECT > window.innerHeight) {
                    scenarioHeight = window.innerHeight - scenarioMargin*2;
                    scenarioWidth = scenarioHeight * RATIOS.ASPECT - scenarioMargin*2;
                } else {
                    scenarioHeight = scenarioWidth/RATIOS.ASPECT - scenarioMargin*2;
                }
                headerHeight = MAX_HEADER_HEIGHT;
            } else if (nrScenarios == 2) {
                scenarioMargin = MAX_SCENARIO_MARGIN / 2;
                if (window.innerWidth/window.innerHeight > RATIOS.ASPECT) {
                    // scnecarios will be in one row
                    nrCols = 2;
                    scenarioWidth = window.innerWidth/2 - scenarioMargin*3;
                    if (scenarioWidth/RATIOS.ASPECT > window.innerHeight) {
                        scenarioHeight = window.innerHeight - scenarioMargin*2;
                        scenarioWidth = scenarioHeight * RATIOS.ASPECT - scenarioMargin*3;
                    } else {
                        scenarioHeight = scenarioWidth/RATIOS.ASPECT - scenarioMargin*2;
                    }
                } else {
                    // scenarios will be in one column
                    nrCols = 1;
                    scenarioWidth = window.innerWidth - scenarioMargin * 2;
                    if (scenarioWidth / RATIOS.ASPECT * 2 > window.innerHeight) {
                        scenarioHeight = window.innerHeight / 2 - scenarioMargin * 3;
                        scenarioWidth = scenarioHeight * RATIOS.ASPECT - scenarioMargin * 2;
                    } else {
                        scenarioHeight = scenarioWidth / RATIOS.ASPECT - scenarioMargin * 3;
                    }
                }
                headerHeight = MAX_HEADER_HEIGHT / 2;
            } else if (nrScenarios > 2) {
                scenarioMargin = MAX_SCENARIO_MARGIN / 4;
                nrCols = 2;
                scenarioWidth = window.innerWidth/2 - scenarioMargin*3;
                if (scenarioWidth/RATIOS.ASPECT*2 > window.innerHeight) {
                    scenarioHeight = window.innerHeight/2 - scenarioMargin*3;
                    scenarioWidth = scenarioHeight * RATIOS.ASPECT - scenarioMargin*3;
                } else {
                    scenarioHeight = scenarioWidth/RATIOS.ASPECT - scenarioMargin*3;
                }
                headerHeight = MAX_HEADER_HEIGHT / 4;
            }
            diagramWidth = scenarioWidth;
            diagramHeight = scenarioHeight * RATIOS.DIAGRAMHEIGHT;
            sliderWidth = scenarioWidth;
            sliderHeight = scenarioHeight * RATIOS.SLIDERHEIGHT;
            //textSize = scenarioHeight * RATIOS.TEXTSIZE;
            controlsSize = scenarioHeight * RATIOS.CONTROLSSIZE;
            glyphiconSize = scenarioHeight * RATIOS.GLYPHICONSIZE;
        }
    };


    /**
     * Creates and adds a scenario to the grids list of scenarios. Doesn't create html elements for it.
     * @param parameters an object containing parameter settings that this scenario will represent.
     * @returns {Object} this grid
     */
     grid.addScenario = function(parameters) {
        var scenario = EnergyTool.scenario();
        scenario.parameters(parameters);
        scenario.id(nrScenarios++);
        scenarios[scenario.id()] = scenario;
        return grid;
    };

    /**
     * Copies the parameters object of the scenario with the given ID and adds a new scenario with these parameters to
     * the grid.
     * @param id the ID of the scenario to be copied
     * @returns {Object}
     */
    grid.copyScenario = function(id) {
        var params = scenarios[id].parameters();
        var paramsCopy = {};
        for (var attr in params) {
            if (params.hasOwnProperty(attr)) paramsCopy[attr] = params[attr];
        }
        grid.addScenario(paramsCopy);
        grid.clear();
        grid.create();
        return grid;
    };

    /**
     * Removes the scenario with the given ID from the grid.
     * @param id the ID of the scenario to be removed
     * @returns {Object}
     */
    grid.removeScenario = function(id) {
        scenarios.splice(id, 1);
        nrScenarios--;
        grid.clear();
        grid.create();
        return grid;
    };

    return grid;
};

/**
 * Sets up and returns a scenario object. Every scenario is the container for the sankey diagram, time slider and
 * possibly other things. It also holds a parameters object with parameter settings like the current year.
 * @returns {Object} the scenario object
 */
EnergyTool.scenario = function () {
    var scenario = {},
        parameters = {},
        sankey,
        timeslider,
        widgetDOM,
        id;

    /* GETTERS AND SETTERS */
    scenario.gridCellDOM = function (_) {
        if (!arguments.length) return widgetDOM;
        widgetDOM = _;
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

    scenario.parameters = function (_) {
        if (!arguments.length) return parameters;
        parameters = _;
        return scenario;
    };

    /**
     * Creates a sankey diagram with the given sizes and current parameters of this scenario. The sankey diagram will
     * be drawn in the svg element of the widget element of this scenario.
     * @param diagramWidth
     * @param diagramHeight
     * @param textSize
     * @returns {Object} this scenario
     */
    scenario.createSankey = function (diagramWidth, diagramHeight, textSize, maxSinkValue) {
            sankey = EnergyTool.sankey()
                .size([diagramWidth, diagramHeight])
                .textSize(textSize)
                .svg(d3.select(widgetDOM).select(".sankey"))
                .maxSinkValue(maxSinkValue);

            loadEnergyData(parameters.currentYear, sankey.create);

        return scenario;
    };

    /**
     * Creates a timeslider with the given sizes. This scenario itself is handed to the timeslider object which it uses
     * for for callbacks to the sankey diagram and
     * @param sliderWidth
     * @param sliderHeight
     * @param textSize
     * @returns {Object} this scenario
     */
    scenario.createTimeSlider = function(sliderWidth, sliderHeight, textSize) {
        timeslider = EnergyTool.timeslider()
            .size([sliderWidth, sliderHeight])
            .textSize(textSize)
            .sliderDiv(d3.select(widgetDOM).select(".timeslider"))
            .scenario(scenario)
            .create();
        return scenario;
    };


    /**
     * EXPERIMENTAL: SERVER SIDE FUNCTIONALITY NOT IMPLEMENTED
     * Sends the sankey diagrams svg element to the server for conversion to a PNG.
     * The server should convert and respond with the PNG for download.
     * @returns {Object} this scenario
     */
    scenario.exportSankeyAsPNG = function() {
        var serverUrl = "http://localhost:8888/energysysvis/exportSVG.php";
        var iframeId = "iframeId";     // Change this to fit your code
        // Create new iframe
        var iframe = $('<iframe src=""' + serverUrl + '"" name="' + iframeId + '" id="' + iframeId + '"></iframe>')
            .appendTo(document.body)
            .hide();
        // Create input
        var input = '<input type="hidden" name="data" value="' + encodeURIComponent($(widgetDOM).find(".sankey").prop('outerHTML')) + '" />';
        // Create form to send request
        $('<form action="' + serverUrl + '" method="' + 'POST' + '" target="' + iframeId + '">' + input + '</form>')
            .appendTo(document.body)
            .submit()
            .remove();
        return scenario;
    };

    return scenario;
};

d3.slider = function module() {
    "use strict";

    var div,
        min = 0,
        max = 100,
        svg,
        value,
        classPrefix,
        axis,
        ticks = 0,
        tickValues,
        scale,
        tickFormat,
        dragger,
        range = false,
        callbackFn,
        stepValues,
        focus,
        ratios = {
            margin : 0.1,
            width: 0.9,
            rectHeight: 1, // percent of the outer dragger size
            tickSize: 0.1,
            draggerInnerSize: 0.5, // percent of the outer dragger
            draggerOuterSize: 0.16, // percent of the containing div height
            textSize: 0.02, // percent of the containing div height
            marginSide: 0.05, // percent of the containting div width
        },
        margin = {top: 25, right: 25, bottom: 15, left: 25},
        tickSize = 6,
        rect,
        rectHeight,
        width,
        height = 40,
        draggerInnerSize,
        draggerOuterSize,
        textSize,
        size;

    function slider(selection) {
        selection.each(function () {
            div = d3.select(this).classed('d3slider', true);
            width = size[0] - (margin.left + margin.right);

            value = value || min;
            scale = d3.scale.linear().domain([min, max]).range([0, width])
                .clamp(true);

// SVG
            svg = div.append("svg")
                .attr("class", "d3slider-axis")
                .attr("width", size[0])
                .attr("height", size[1])
                .append("g")
                .attr("transform", "translate(" + margin.left +
                "," + margin.top + ")");

// Range rect
            svg.append("rect")
                .attr("class", "d3slider-rect-range")
                .attr("width", width)
                .attr("height", rectHeight);

// Range rect
            if (range) {
                svg.append("rect")
                    .attr("class", "d3slider-rect-value")
                    .attr("width", scale(value))
                    .attr("height", rectHeight);
            }

// Axis
            var axis = d3.svg.axis()
                .scale(scale)
                .orient("bottom");

            if (ticks != 0) {
                axis.ticks(ticks);
                axis.tickSize(tickSize);
            } else if (tickValues) {
                axis.tickValues(tickValues);
                axis.tickSize(tickSize);
            } else {
                axis.ticks(0);
                axis.tickSize(0);
            }
            if (tickFormat) {
                axis.tickFormat(tickFormat);
            }

            svg.append("g")
                .attr("transform", "translate(0," + rectHeight + ")")
                .call(axis);
//.selectAll(".tick")
//.data(tickValues, function(d) { return d; })
//.exit()
//.classed("minor", true);

            var values = [value];
            dragger = svg.selectAll(".dragger")
                .data(values)
                .enter()
                .append("g")
                .attr("class", "dragger")
                .attr("transform", function (d) {
                    return "translate(" + scale(d) + ")";
                });

            dragger.append("circle")
                .attr("class", "dragger-outer")
                .attr("r", draggerOuterSize)
                .attr("transform", function (d) {
                    return "translate(0, " + draggerOuterSize/2 + ")";
                });

            dragger.append("circle")
                .attr("class", "dragger-inner")
                .attr("r", draggerInnerSize)
                .attr("transform", function (d) {
                    return "translate(0, " + draggerOuterSize/2+ ")";
                });


// Enable dragger drag
            var dragBehaviour = d3.behavior.drag();
            dragBehaviour.on("drag", slider.drag);
            dragger.call(dragBehaviour);

// Move dragger on click
            svg.on("click", slider.click);

        });
    }

    slider.draggerTranslateFn = function () {
        return function (d) {
            return "translate(" + scale(d) + ")";
        }
    };

    slider.click = function () {
        var pos = d3.event.offsetX || d3.event.layerX;
        slider.move(pos);
    };

    slider.drag = function () {
        var pos = d3.event.x;
        slider.move(pos + margin.left);
    };

    slider.move = function (pos) {
        var l, u;
        var newValue = scale.invert(pos - margin.left);
// find tick values that are closest to newValue
// lower bound
        if (stepValues != undefined) {
            l = stepValues.reduce(function (p, c, i, arr) {
                if (c < newValue) {
                    return c;
                } else {
                    return p;
                }
            });

// upper bound
            if (stepValues.indexOf(l) < stepValues.length - 1) {
                u = stepValues[stepValues.indexOf(l) + 1];
            } else {
                u = l;
            }
// set values
            var oldValue = value;
            value = ((newValue - l) <= (u - newValue)) ? l : u;

        } else {
            var oldValue = value;
            value = newValue;
        }
        var values = [value];

// Move dragger
        svg.selectAll(".dragger").data(values)
            .attr("transform", function (d) {
                return "translate(" + scale(d) + ")";
            });

        var displayValue = null;
        if (tickFormat) {
            displayValue = tickFormat(value);
        } else {
            displayValue = d3.format(",.0f")(value);
        }
        svg.selectAll(".dragger").select("text")
            .text(displayValue);

        if (range) {
            svg.selectAll(".d3slider-rect-value")
                .attr("width", scale(value));
        }

        // Claude Mueller: only call the callback function if the dragger changed position from one tick to another.
        if (callbackFn && value != oldValue) {
            callbackFn(slider);
        }
    };

// Getter/setter functions

    /**
     * Sets the size property of this slider and calculates the depending sizes for DOM elements used for the slider.
     * @param _ the size array containing the width and the height
     * @returns {*} this slider
     * @author Claude Mueller
     */
    slider.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        width = ratios.width * size[0];
        draggerOuterSize = size[1] * ratios.draggerOuterSize;
        draggerInnerSize = draggerOuterSize * ratios.draggerInnerSize;
        rectHeight = ratios.rectHeight * draggerOuterSize;
        margin.top = margin.bottom = draggerOuterSize;
        margin.left = margin.right = ratios.marginSide * size[0];
        return slider;
    };

    slider.min = function (_) {
        if (!arguments.length) return min;
        min = _;
        return slider;
    };

    slider.textSize = function(_) {
        if (!arguments.length) return textSize;
        textSize = _;
        return slider;
    };

    slider.max = function (_) {
        if (!arguments.length) return max;
        max = _;
        return slider;
    };

    slider.classPrefix = function (_) {
        if (!arguments.length) return classPrefix;
        classPrefix = _;
        return slider;
    };

    slider.tickValues = function (_) {
        if (!arguments.length) return tickValues;
        tickValues = _;
        return slider;
    };

    slider.ticks = function (_) {
        if (!arguments.length) return ticks;
        ticks = _;
        return slider;
    };

    slider.stepValues = function (_) {
        if (!arguments.length) return stepValues;
        stepValues = _;
        return slider;
    };

    slider.tickFormat = function (_) {
        if (!arguments.length) return tickFormat;
        tickFormat = _;
        return slider;
    };

    slider.value = function (_) {
        if (!arguments.length) return value;
        value = _;
        return slider;
    };

    slider.showRange = function (_) {
        if (!arguments.length) return range;
        range = _;
        return slider;
    };

    slider.callback = function (_) {
        if (!arguments.length) return callbackFn;
        callbackFn = _;
        return slider;
    };

    slider.setValue = function (newValue) {
        var pos = scale(newValue) + margin.left;
        slider.move(pos);
    };

    slider.mousemove = function () {
        var pos = d3.mouse(this)[0];
        var val = slider.getNearest(scale.invert(pos), stepValues);
        focus.attr("transform", "translate(" + scale(val) + ",0)");
        focus.selectAll("text").text(val);
    };

    slider.getNearest = function (val, arr) {
        var l = arr.reduce(function (p, c, i, a) {
            if (c < val) {
                return c;
            } else {
                return p;
            }
        });
        var u = arr[arr.indexOf(l) + 1];
        var nearest = ((value - l) <= (u - value)) ? l : u;
        return nearest;
    };

    slider.destroy = function () {
        div.selectAll('svg').remove();
        return slider;
    };

    return slider;

};



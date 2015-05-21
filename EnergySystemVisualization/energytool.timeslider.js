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

EnergyTool.timeslider = function() {
    var timeslider = {};
    var size = [];
    var handleHeight;
    var sliderBarHeight;
    var yearsAvailable;
    var sliderDiv;
    var scenario;
    var textSize;

    timeslider.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        handleHeight = 0.5 * size[1];
        sliderBarHeight = 0.19 * size[1];
        return timeslider;
    };

    timeslider.sliderDiv = function (_) {
        if (!arguments.length) return sliderDiv;
        sliderDiv = _;
        return timeslider;
    };

    timeslider.textSize = function (_) {
        if (!arguments.length) return textSize;
        textSize = _;
        return timeslider;
    };

    timeslider.scenario = function (_) {
        if (!arguments.length) return scenario;
        scenario = _;
        return timeslider;
    };

    timeslider.create = function () {
        if (yearsAvailable) {
            createTimeSlider(yearsAvailable);
        } else {
            getYearsAvailable(createTimeSlider);
        }

        function createTimeSlider(years) {

            var slider = d3.slider()
                .size(size)
                .min(years[0])
                .max(years[years.length-1])
                .ticks(10)
                .tickFormat(d3.format())
                .stepValues(years)
                .value(parameters["currentYear"])
                .callback(callback);

            sliderDiv.call(slider);

            function callback(slider) {
                loadEnergyData(slider.value(), scenario.sankey().updateDiagram);
                scenario.parameters["currentYear"] = slider.value();
            }
        }
        return timeslider;
    };
    return timeslider;
};

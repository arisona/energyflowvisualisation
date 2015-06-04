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

var serverUrl = "http://localhost:8888/energytool/";
var index = serverUrl + "index.php";
var energyDataQuery = "energyData";
var yearsAvailableQuery = "yearsAvailable";
var maxSinkValueQuery = "maxSinkValue";

/**
 * Requests the energy data (as JSON) for the given year and provides the callback function with it.
 * @param year the year for which data should be retrieved
 * @param callback the callback function to be provided with the data
 */
function loadEnergyData(year, callback) {
    var query = index + "?q=" + energyDataQuery + "&y=" + year;
    d3.json(query, function (error, json) {
        if (error) {
            alert("Error ocurred while requesting the energy data");
        } else {
            callback(json);
        }
    })
}

/**
 * Requests a list of all years that are available for the scenarios and provides the callback function with it.
 * @param callback the callback function to be provided with the data
 */
function getYearsAvailable(callback) {
    d3.json(index + "?q=" + yearsAvailableQuery, function (error, json) {
        if (error) {
            alert("Error ocurred while requesting the years available");
        } else {
            callback(json);
        }
    })
}

/**
 * Requests the maximal value that any sink node can have and provides the callback function with it.
 * @param callback the callback function to be provided with the data
 */
function getMaxSinkValue(callback) {
    d3.json(index + "?q=" + maxSinkValueQuery, function (error, json) {
        if (error) {
            alert("Error ocurred while requesting energy data");
        } else {
            callback(json["maxSinkValue"]);
        }
    })
}

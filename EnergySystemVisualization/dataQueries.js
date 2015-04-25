/**
 * Created by Claude on 04.04.2015.
 */

var serverUrl = "http://localhost/energysysvis/index.php";
var energyDataQuery = "energyData";
var yearsAvailableQuery = "yearsAvailable";
var maxTotalValueQuery = "maxTotalValue";

function loadEnergyData(year, callback) {
    var query = serverUrl + "?q=" + energyDataQuery + "&y=" + year;
    // CAUTION! loads data asynchronously.
    d3.json(query, function (error, json) {
        if (error) {
            console.log("Error ocurred while loading energy data: " + error);
            console.log("Loading data from local file 'data_generated.json'");
            d3.json("data/data_generated.json", function (error, json) {
                callback(json);
            })
        } else {
            callback(json);
        }
    })
}

function getYearsAvailable(callback) {
    d3.json(serverUrl + "?q=" + yearsAvailableQuery, function (error, json) {
        if (error) {
            console.log("Error ocurred while requesting years available: " + error);
            console.log("Returning static values");
            callback([2000, 2001]);
        } else {
            callback(json);
        }
    })
}

function getMaxTotalValue(callback) {
    d3.json(serverUrl + "?q=" + maxTotalValueQuery, function (error, json) {
        if (error) {
            console.log("Error ocurred while requesting maximum total value: " + error);
            console.log("Returning static value");
            callback(500000);
        } else {
            callback(json["maxTotalValue"]);
        }
    })
}

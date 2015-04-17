/**
 * Created by Claude on 04.04.2015.
 */

var serverUrl = "http://localhost/energysysvis/index.php";
var energyDataQuery = "energyData";

function loadEnergyData(createDiagram) {
    // CAUTION! loads data asynchronously.
    d3.json(serverUrl + "?q=" + energyDataQuery, function (error, json) {
            if (error) {
                console.log("Error ocurred while loading energy data: " + error);
                console.log("Loading data from local file 'data_custom.json'");
                d3.json("data/data_custom.json", function (error, json) {
                    createDiagram(json);
                })
            } else {
                createDiagram(json);
            }
        })
}

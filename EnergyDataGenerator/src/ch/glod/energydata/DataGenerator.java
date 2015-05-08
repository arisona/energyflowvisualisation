package ch.glod.energydata;

import javax.json.Json;
import javax.json.stream.JsonGenerator;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.util.*;

/**
 * Created by Claude on 19.04.2015.
 */
public class DataGenerator {
    static Random r = new Random();
    static final int startYear = 1950;
    static final int years = 10;
    static final String folder = "C:/xampp/htdocs/energysysvis/data/";
    static Map<String,Node> sinks;

    public static void main(String[] args) {

        LinkedList<Integer> yearsAvailable = new LinkedList<>();
        int imp = 200_000;
        int prod = 100_000;
        int stock = 20_000;

        int maxSinkValue = 0;

        for (int i = 0; i < years; i++) {
            imp *= (r.nextFloat() + 0.5);
            prod *= (r.nextFloat() + 0.5);
            stock *= (r.nextFloat() + 0.5);

            int currMaxSinkValue = generateData(imp, prod, stock, startYear + i);
            if (currMaxSinkValue > maxSinkValue) {
                maxSinkValue = currMaxSinkValue;
            }
            yearsAvailable.add(startYear + i);
        }

        File maxValue = new File(folder + "maxSinkValue.json");
        try {
            JsonGenerator gen = Json.createGenerator(new FileOutputStream(maxValue));
            gen.writeStartObject()
                    .write("maxSinkValue", maxSinkValue)
            .writeEnd();
            gen.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }

        File yearsAvail = new File(folder + "yearsAvailable.json");
        try {
            JsonGenerator gen = Json.createGenerator(new FileOutputStream(yearsAvail));
            gen.writeStartArray();
                for (Integer i : yearsAvailable) {
                    gen.write(i);
                }
            gen.writeEnd();
            gen.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
    }

    static int generateData(int imp, int prod, int stock, int year) {
        Map<String,Node> allNodes = setUpGraph(imp, prod, stock);
        for (Node n : allNodes.values()) {
            for (Node t : n.targetNodes) {
                t.sources++;
            }
        }

        // Calculate values for the links.
        Map<String,Node> calcedNodes = new HashMap<String, Node>();
        while (allNodes.size() > 0) {
            Iterator<Node> it = allNodes.values().iterator();
            while (it.hasNext()) {
                Node n = it.next();
                if (n.allSourcesVisited()) {
                    calcTargetLinks(n);
                    it.remove();
                    calcedNodes.put(n.name, n);
                }
            }
        }


        generateJson(calcedNodes, year);

        int currMaxSinkValue = 0;
        for (Node sink : sinks.values()) {
            if (sink.value > currMaxSinkValue) currMaxSinkValue = sink.value;
        }
        return currMaxSinkValue;
    }

    static void generateJson(Map<String, Node> allNodes, int year) {
        File generated = new File(folder + "data_" + year + ".json");
        try {
            JsonGenerator gen = Json.createGenerator(new FileOutputStream(generated));
            gen.writeStartObject();

            gen.writeStartArray("nodes");
            for (Node n : allNodes.values()) {
                gen.writeStartObject()
                        .write("name", n.name)
                        .write("type", n.type)
                        .write(n.attrType.attrType, n.attr)
                        .writeEnd();
            }
            gen.writeEnd();

            gen.writeStartArray("links");
            for (Node n : allNodes.values()) {
                for (Node t : n.targetNodes) {
                    gen.writeStartObject()
                            .write("source", n.name)
                            .write("target", t.name)
                            .write("value", n.flows.get(t))
                            .writeEnd();
                }
            }
            gen.writeEnd();

            gen.writeStartArray("info");
                gen.writeStartObject()
                    .write("year", year)
                    .writeEnd();
            gen.writeEnd();
            gen.writeEnd();
            gen.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }

    }

    static void calcTargetLinks(Node node) {
        int remaining = node.value;
        for (int i = node.targetNodes.size(); i > 0; i--) {
            Node t = node.targetNodes.get(i - 1);
            t.sourcesVisited++;
            float flow = remaining / i;
//            if (i > 1) flow *= r.nextFloat() + 1;
            t.value += flow;
            remaining -= flow;
            node.flows.put(t, (int)flow);
        }
    }

    static Map<String, Node> setUpGraph(int imp, int production, int outOfStock) {
        Map<String, Node> origins = new HashMap<>();
        origins.put("Import", new Node("Import", "origin", AttrType.imgUrl, "images/import.png ", imp));
        origins.put("Production", new Node("Production", "origin", AttrType.imgUrl, "images/production.png",
                production));
        origins.put("Out of Stock", new Node("Out of Stock", "origin", AttrType.imgUrl, "images/out_of_stock.png",
                outOfStock));

        sinks = new HashMap<>();
        sinks.put("Export", new Node("Export", "sink", AttrType.imgUrl, "images/export.png", 0));
        sinks.put("Into Stock", new Node("Into Stock", "sink", AttrType.imgUrl, "images/into_stock.png", 0));
        sinks.put("Households", new Node("Households", "sink", AttrType.imgUrl, "images/households.png", 0));
        sinks.put("Services", new Node("Services", "sink", AttrType.imgUrl, "images/services.png", 0));
        sinks.put("Industry", new Node("Industry", "sink", AttrType.imgUrl, "images/industry.png", 0));
        sinks.put("Transport", new Node("Transport", "sink", AttrType.imgUrl, "images/transport.png", 0));
        sinks.put("Non-energetic", new Node("Non-energetic", "sink", AttrType.imgUrl, "images/non-energetic.png", 0));

        Map<String, Node> processes = new HashMap<>();
        processes.put("Thermal", new Node("Thermal", "process", AttrType.imgUrl, "images/thermal.png", 0));
        processes.put("Refineries", new Node("Refineries", "process", AttrType.imgUrl, "images/refineries.png", 0));
        processes.put("Hydro/Nuclear", new Node("Hydro/Nuclear", "process", AttrType.imgUrl, "images/hydro_nuclear" +
                ".png", 0));
        processes.put("Gasworks", new Node("Gasworks", "process", AttrType.imgUrl, "images/gasworks.png", 0));

        Map<String, Node> energytypes = new HashMap<>();
        energytypes.put("Wood/Coal/Waste", new Node("Wood/Coal/Waste", "energytype", AttrType.color, "#614126", 0));
        energytypes.put("Crude Oil", new Node("Crude Oil", "energytype", AttrType.color, "#FF0000", 0));
        energytypes.put("Petroleum", new Node("Petroleum ", "energytype", AttrType.color, "#FFA500", 0));
        energytypes.put("Natural Gas", new Node("Natural Gas", "energytype", AttrType.color, "#FFFF00", 0));
        energytypes.put("Nuclear Fuel", new Node("Nuclear Fuel", "energytype", AttrType.color, "#00FF00", 0));
        energytypes.put("Hydropower", new Node("Hydropower", "energytype", AttrType.color, "#3366CC", 0));
        energytypes.put("New Renewables", new Node("New Renewables", "energytype", AttrType.color, "#8A5895", 0));
        energytypes.put("Electricity", new Node("Electricity", "energytype", AttrType.color, "#00FFFF", 0));
        energytypes.put("District Heat", new Node("District Heat", "energytype", AttrType.color, "#787878", 0));

        // Assign target nodes
        origins.get("Import").targetNodes.addAll(energytypes.values());
        origins.get("Import").targetNodes.remove(energytypes.get("District Heat"));
        origins.get("Import").targetNodes.remove(energytypes.get("Hydropower"));
        origins.get("Import").targetNodes.remove(energytypes.get("New Renewables"));

        origins.get("Production").targetNodes.add(energytypes.get("Wood/Coal/Waste"));
        origins.get("Production").targetNodes.add(energytypes.get("Hydropower"));

        origins.get("Out of Stock").targetNodes.add(energytypes.get("Wood/Coal/Waste"));
        origins.get("Out of Stock").targetNodes.add(energytypes.get("Petroleum"));


        energytypes.get("Crude Oil").targetNodes.add(processes.get("Refineries"));
        energytypes.get("Crude Oil").targetNodes.add(sinks.get("Into Stock"));

        energytypes.get("Wood/Coal/Waste").targetNodes.add(sinks.get("Export"));
        energytypes.get("Wood/Coal/Waste").targetNodes.add(sinks.get("Households"));
        energytypes.get("Wood/Coal/Waste").targetNodes.add(sinks.get("Industry"));
        energytypes.get("Wood/Coal/Waste").targetNodes.add(processes.get("Thermal"));

        energytypes.get("Natural Gas").targetNodes.add(processes.get("Thermal"));
        energytypes.get("Natural Gas").targetNodes.add(sinks.get("Households"));
        energytypes.get("Natural Gas").targetNodes.add(sinks.get("Services"));
        energytypes.get("Natural Gas").targetNodes.add(sinks.get("Industry"));
        energytypes.get("Natural Gas").targetNodes.add(sinks.get("Transport"));

        energytypes.get("Nuclear Fuel").targetNodes.add(processes.get("Hydro/Nuclear"));

        energytypes.get("Hydropower").targetNodes.add(processes.get("Hydro/Nuclear"));

        energytypes.get("Electricity").targetNodes.add(sinks.get("Export"));
        energytypes.get("Electricity").targetNodes.add(sinks.get("Households"));
        energytypes.get("Electricity").targetNodes.add(sinks.get("Services"));
        energytypes.get("Electricity").targetNodes.add(sinks.get("Industry"));

        energytypes.get("District Heat").targetNodes.add(sinks.get("Households"));
        energytypes.get("District Heat").targetNodes.add(sinks.get("Services"));
        energytypes.get("District Heat").targetNodes.add(sinks.get("Industry"));

        energytypes.get("Petroleum").targetNodes.add(sinks.get("Export"));
        energytypes.get("Petroleum").targetNodes.add(sinks.get("Non-energetic"));
        energytypes.get("Petroleum").targetNodes.add(sinks.get("Households"));
        energytypes.get("Petroleum").targetNodes.add(sinks.get("Transport"));
        energytypes.get("Petroleum").targetNodes.add(sinks.get("Industry"));
        energytypes.get("Petroleum").targetNodes.add(sinks.get("Services"));
        energytypes.get("Petroleum").targetNodes.add(processes.get("Thermal"));


        processes.get("Thermal").targetNodes.add(energytypes.get("District Heat"));
        processes.get("Thermal").targetNodes.add(energytypes.get("Electricity"));

        processes.get("Refineries").targetNodes.add(energytypes.get("Petroleum"));

        processes.get("Hydro/Nuclear").targetNodes.add(energytypes.get("Electricity"));
        processes.get("Hydro/Nuclear").targetNodes.add(energytypes.get("District Heat"));


        // Calculate the number of source nodes for every node.
        Map<String, Node> allNodes = new HashMap<>();
        allNodes.putAll(origins);
        allNodes.putAll(processes);
        allNodes.putAll(energytypes);
        allNodes.putAll(sinks);
        return allNodes;
    }
}

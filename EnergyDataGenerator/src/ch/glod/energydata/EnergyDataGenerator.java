package ch.glod.energydata;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.stream.JsonGenerator;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * Generates and adds varied data to a starting data set from and to JASON files.
 * @author Claude Mueller
 *
 */
public class EnergyDataGenerator {
	
	private static final double INCREMENT = 20;
	private static final int START_YEAR = 1990;

	public static void main(String[] args) throws Exception {
        File origin = new File(EnergyDataGenerator.class.getResource("res/data_origin.json").toURI());
        File generated = new File("data_generated.json");

        try (InputStream is = new FileInputStream(origin);
        JsonReader rdr = Json.createReader(is)) {
        	JsonGenerator gen = Json.createGenerator(new FileOutputStream(generated));
            JsonObject obj = rdr.readObject();
            JsonArray nodes = obj.getJsonArray("nodes");
            JsonArray links = obj.getJsonArray("links");

        	gen.writeStartObject()
        	.writeStartArray("data");
        	for (int i = 0; i < 5; i++) {
                gen.writeStartObject()
                    .write("year", START_YEAR + i)
                    .writeStartArray("nodes");
                    for (JsonObject node : nodes.getValuesAs(JsonObject.class)) { 
                        gen.writeStartObject()
                            .write("name", node.getString("name"))
                        .writeEnd();
                    }
                    gen.writeEnd()
                    .writeStartArray("links");
                    for (JsonObject link : links.getValuesAs(JsonObject.class)) { 
                        double value = link.getJsonNumber("value").doubleValue() ;
                    	if (link.getInt("source") == 8 && link.getInt("target") == 9) {
                    		// increase coal reserves
                    		value *= (i+1)*5;
                    	}
//                    	if (link.getInt("source") == 8 && link.getInt("target") == 7) {
//                    		// increase coal reserves
//                    		value *= 3;
//                    	}
                        gen.writeStartObject()
                            .write("source", link.getInt("source"))
                            .write("target", link.getInt("target"))
                            .write("value", value)
                        .writeEnd();
                    }
                    gen.writeEnd()
                .writeEnd();
            }
            gen.writeEnd();
            gen.writeEnd();
            gen.close();
        }
    }
}

package ch.glod.energydata;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Node {
    String name;
    String type;
    int value;
    AttrType attrType;
    String attr;
    List<Node> targetNodes;
    Map<Node, Integer> flows;
    int sources;
    int sourcesVisited;

    public Node(String name, String type, AttrType attrType, String attr, int value) {
        this.name = name;
        this.type = type;
        this.value = value;
        this.attrType = attrType;
        this.attr = attr;
        this.sourcesVisited = 0;
        this.sources = 0;
        this.targetNodes =  new ArrayList<>();
        this.flows = new HashMap<>();
    }

    public boolean allSourcesVisited() {
        return sources == sourcesVisited;
    }
}







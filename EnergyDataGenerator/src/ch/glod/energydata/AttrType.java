package ch.glod.energydata;

/**
 * Created by Claude on 19.04.2015.
 */
public enum AttrType {
    color ("color"),
    imgUrl ("imgUrl");

    final String attrType;

    AttrType(String a) {this.attrType = a; }
}

/**
 * The possible node types.
 * ORIGIN: the nodes that have only target links.
 * ENERGYTYPE: the nodes that represent an energy type.
 * PROCESS: the nodes that represent stages in which the energytypes are processed.
 * SINK: the nodes that have only source links.
 * @type {{ORIGIN: string, ENERGYTYPE: string, PROCESS: string, SINK: string}}
 */
var NODETYPES = {
    ORIGIN: "origin",
    ENERGYTYPE: "energytype",
    PROCESS: "process",
    SINK: "sink"
};

var OPACITY = {
    NODE_DEFAULT: 1,
    NODE_FADED: 0.2,
    LINK_DEFAULT: 0.6,
    LINK_FADED: 0.05
};

var TRANSITION_DURATION = 400;


d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
/* Properties of the node objects: */
// name
// type, One of the types from enum NODETYPES.
// value, The energy value of the node
// sourceLinks, the links that are outgoing from this node. For these links the node is the source.
// targetLinks, the links that are incoming to this node. For these links the node is the target.
// x, The position of the node in x-direction
// y, The postion of the node in y-direction
// dx, the node's width.
// dy, The node's height

enerqi.sankey = function () {
    var sankey = {},
        nodeWidth = 24,
        nodePadding = 8,
        size = [1, 1],
        nodes = [],
        links = [],
        minNodeHeight = nodeWidth,
        minLinkHeight = 3,
    // the d3 selection of the widget that contains this sankey.
        widgetRoot,
        linkSelection,
        nodeSelection,
        sinkNodeSize,
        maxSinkValue,
        sinkNodes;

    sankey.widgetRoot = function (_) {
        if (!arguments.length) return widgetRoot;
        widgetRoot = _;
        return sankey;
    };

    sankey.nodeWidth = function (_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
        minNodeHeight = nodeWidth;
        return sankey;
    };

    sankey.minLinkHeight = function (_) {
        if (!arguments.length) return minLinkHeight;
        minLinkHeight = _;
        return sankey;
    };

    sankey.nodePadding = function (_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return sankey;
    };

    sankey.nodes = function (newNodes) {
        if (!arguments.length) return nodes;
        newNodes.forEach(function (node) {
            initializeNode(node);
        });
        sinkNodes = [];
        newNodes.forEach(function(node) {
            if (node.type == NODETYPES.SINK) { sinkNodes.push(node); }
        });
        nodes = d3.map(newNodes, function (d) {
            return d.name;
        });
        return sankey;
    };

    sankey.links = function (newLinks) {
        if (!arguments.length) return links;
        links = newLinks;
        return sankey;
    };

    sankey.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
    };

    function calcPath() {
        var curvature = .5;

        function calcPath(d) {
            var x0 = d.source.x + d.source.dx,
                x1 = d.target.x,
                xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0 = d.source.y + d.sy + d.dy / 2,
                y1 = d.target.y + d.ty + d.dy / 2;
            return "M" + x0 + "," + y0
                + "C" + x2 + "," + y0
                + " " + x3 + "," + y1
                + " " + x1 + "," + y1;
        }

        calcPath.curvature = function(_) {
            if (!arguments.length) return curvature;
            curvature = +_;
            return calcPath;
        };

        return calcPath;
    }

    var path = calcPath();

    var pathtext = function (d) {
        var ys = d.source.y + d.sy + d.dy / 2;
        var yt = d.target.y + d.ty + d.dy / 2;
        return (ys + yt) / 2;
    };

//            sankey.copyDiagramm = function() {
//                var newDiv = document.createElement("div");
//                gridster.add_widget(newDiv);
//                newDiv = d3.select(newDiv);
//                newDiv.append("header").style("height", headerHeight + "px").style("background", "pink");
//                newDiv.append("svg");
//                newDiv.append("div");
//                nrOfDiagrams++;
//            }

    sankey.createDiagram = function () {
        // Set up svg element
        d3.select(widgetRoot).select("svg")
            .attr("width", size[0])
            .attr("height", size[1]);

        getYearsAvailable(receiveYearsAvailable);
        // callback function that receives the available years form the server and reatrieves the energy data for that year.
        function receiveYearsAvailable(years) {
            loadEnergyData(years[0], receiveDataFromYear);
            // callback function receives the energy data from the server.
            function receiveDataFromYear(graph) {
                getMaxSinkValue(receiveMaxSinkValue);
                // callback function receives maximal sink value from server.
                function receiveMaxSinkValue(value) {
                    maxSinkValue = value;
                    sankey.nodes(graph["nodes"]);
                    sankey.links(graph["links"]);
                    sankey.layout(300);
                    computeConnectedNodes();
                    createSVGPatterns();

                    /* create links */
                    linkSelection = d3.select(widgetRoot).select("svg")
                        .append("g")
                        .attr("class", "links")
                        .selectAll(".link")
                        .data(sankey.links());

                    createNewLinks(linkSelection.enter());

                    /* create nodes */
                    nodeSelection = d3.select(widgetRoot).select("svg")
                        .append("g")
                        .attr("class", "nodes")
                        .selectAll(".node")
                        .data(sankey.nodes().values());

                    createNewNodes(nodeSelection.enter());

                    function createSVGPatterns() {
                        // create patterns in the chart's defs element.
                        var patterns = d3.select(widgetRoot).select("svg")
                            .append("defs").selectAll("pattern")
                            .data(sankey.nodes().values()).enter()
                            .append("pattern")
                            .filter(function (d) {
                                return d.type != NODETYPES.ENERGYTYPE;
                            })
                            .attr("id", function (d) {
                                return d.name.replace(/\s/g, "-");
                            })
                            .attr("patternUnits", 'objectBoundingBox')
                            .attr("width", 1)
                            .attr("height", 1)
                            .attr("preserveAspectRatio", "xMidYMid meet")
                            .attr("viewBox", "0 0 1 1");

                        patterns.append("rect")
                            .attr("x", "-50%")
                            .attr("y", "-50%")
                            .attr("width", "100%")
                            .attr("height", "100%")
                            .attr("fill", "white");
                        patterns.append("image")
                            .attr("xlink:href", function (d) {
                                return d.imgUrl;
                            })
                            .attr("width", 1)
                            .attr("height", 1)
                            .attr("fill", "white");

                    }
                }
            }
        }
    };

    sankey.updateDiagram = function (graph) {
        sankey.links(graph["links"]);
        sankey.nodes(graph["nodes"]);
        sankey.layout(300);
        computeConnectedNodes();

        /* update links */
        var links = d3.select(widgetRoot).select("svg").select(".links").selectAll(".link")
            // The link data elements are identified by the concatenation of the source and target name.
            .data(sankey.links(), function (d) {
                return d.source.name + d.target.name;
            });

        /* transition updated links */
        links.select("path").transition()
            .attr("d", path)
            .attr("stroke-width", function(d) { return d.dy; });

        setLinkText(links.select("text"));
        /* remove links that are not present in the new data */
        links.exit().remove();

        /* create links that are in the new and not in the old data*/
        createNewLinks(links.enter());

        /* update nodes */
        var nodeJoin = d3.select(widgetRoot).select("svg").select(".nodes")
            .selectAll(".node")
            // The node data elements are identified by the name of the node.
            .data(sankey.nodes().values(), function (d) { return d.name; });

        /* transition updated nodes */
        nodeJoin.transition()
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr("height", function (d) { return d.dy; })
            .attr("width", sankey.nodeWidth());
        /* not creating any new nodes because all possible nodes should have been provided on first loading the tool */
        /* not removing any new nodes because all possible nodes should be displayed even if they don't have any links */
    };

    //sankey.redrawDiagram = function () {
    //    var links = d3.select(widgetRoot).select("svg").select(".links")
    //        .selectAll(".link")
    //        // The link data elements are identified by the concatenation of the source and target name.
    //        .data(sankey.links(), function (d) {
    //            return d.source.name + d.target.name;
    //        });
    //    /* transition updated links */
    //    links.select("path").attr("d", path);
    //    //links.select(".path0").attr("d", path(0));
    //    //links.select(".path1").attr("d", path(1));
    //    //links.select(".path2").attr("d", path(2));
    //
    //    var nodesToUpdate = d3.select(widgetRoot).select("svg").select(".nodes")
    //        .selectAll(".node")
    //        .data(sankey.nodes().values(), function (d) {
    //            return d.name;
    //        });
    //
    //    nodesToUpdate
    //        .attr("transform", function (d) {
    //            return "translate(" + d.x + "," + d.y + ")";
    //        });
    //    nodesToUpdate.select("rect")
    //        .attr("height", function (d) {
    //            return d.dy;
    //        })
    //        .attr("width", sankey.nodeWidth());
    //};

    sankey.layout = function (iterations) {
        sinkNodeSize = (size[1] - ((sinkNodes.length+1) * nodePadding)) / sinkNodes.length;
        computeNodeLinks();
        computeNodeValues();
        computeNodeBreadths();
        computeNodeDepths(iterations);
        computeLinkDepths();
        return sankey;
    };

    sankey.relayout = function (iterations) {
        if (arguments.length) {
            computeNodeBreadths();
            computeNodeDepths(iterations);
        }
        computeLinkDepths();
        return sankey;
    };

    // Populate the sourceLinks and targetLinks for each node.
    // Also, if the source and target are not objects, assume they are indices.
    function computeNodeLinks() {
        nodes.values().forEach(function (node) {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function (link) {
            var source = link.source = nodes.get(link.source);
            var target = link.target = nodes.get(link.target);

            source.sourceLinks.push(link);
            target.targetLinks.push(link);
        });
    }

    // Compute the value (size) of each node by summing the associated links.
    function computeNodeValues() {
        nodes.values().forEach(function (node) {
            node.value = Math.max(
                d3.sum(node.sourceLinks, value),
                d3.sum(node.targetLinks, value)
            );
            if (node.value == 0) {
                // XXX We wanted to still display nodes without any value, but we can't calculate a position for them
                // if they don't have any in coming or out going links.
                console.log("there are nodes with zero value, we remove them from the list of nodes");
                nodes.remove(node.name);
            }
        });
    }

    // Iteratively assign the breadth (x-position) for each node.
    // Nodes are assigned the maximum breadth of incoming neighbors plus one;
    // nodes with no incoming links are assigned breadth zero, while
    // nodes with no outgoing links are assigned the maximum breadth.
    function computeNodeBreadths() {
        var remainingNodes = nodes.values();
        var nextNodes;
        var x = 0;

        while (remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(function (node) {
                node.x = x;
                node.dx = nodeWidth;
                node.sourceLinks.forEach(function (link) {
                    if (nextNodes.indexOf(link.target) < 0) {
                        nextNodes.push(link.target);
                    }
                });
            });
            remainingNodes = nextNodes;
            ++x;
        }

        moveSinksRight(x);
        scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));

        function moveSinksRight(x) {
            nodes.values().forEach(function (node) {
                if (!node.sourceLinks.length) {
                    node.x = x - 1;
                }
            });
        }

        function scaleNodeBreadths(kx) {
            nodes.values().forEach(function (node) {
                node.x *= kx;
            });
        }
    }

    function computeNodeDepths(iterations) {
        var nodesByBreadth = d3.nest()
            .key(function (d) {
                return d.x;
            })
            .sortKeys(d3.ascending)
            .entries(nodes.values())
            .map(function (d) {
                return d.values;
            });

        initializeNodeDepth();
        resolveCollisions();
        spreadSinkNodes();
        spreadOriginNodes();
        for (var alpha = 1; iterations > 0; --iterations) {
            relaxRightToLeft(alpha *= .99);
            resolveCollisions();
            relaxLeftToRight(alpha);
            resolveCollisions();
        }


        function initializeNodeDepth() {
            //var ky = calcScalingFactor();
            var ky = sinkNodeSize / maxSinkValue;
            console.log(ky);
            console.log(sinkNodeSize);

            nodesByBreadth.forEach(function (nodes) {
                nodes.forEach(function (node, i) {
                    node.y = i;
                    node.dy = node.value * ky;
                    // if the node is a process and doesn't have minimum height it is assigned the minimum height and the
                    // originally calculated height is saved as an property to the node for later use.
                    if (node.dy < minNodeHeight && node.type == NODETYPES.PROCESS) {
                        node.dy = minNodeHeight;
                    }
                    if (node.type == NODETYPES.SINK) {
                        node.dy = sinkNodeSize;
                    }
                });
            });

            links.forEach(function (link) {
                link.dy = link.value * ky;
                // Adjust the links height to the minimum and enlarge the connected nodes if the extra height of the
                // link exceeds the height of the nodes.
                //if (link.dy < minLinkHeight) {
                //    var oldDy = link.dy;
                //    link.dy = minLinkHeight;
                //    if (!link.source.originalDy) {
                //        link.source.dy += link.dy - oldDy;
                //    } else {
                //        if (link.source.originalDy + (link.dy - oldDy) > link.source.dy) {
                //            link.source.dy += link.dy - oldDy;
                //        }
                //    }
                //    if (!link.target.originalDy) {
                //        link.target.dy += link.dy - oldDy;
                //    } else {
                //        if (link.target.originalDy + (link.dy - oldDy) > link.target.dy) {
                //            link.target.dy += link.dy - oldDy;
                //        }
                //    }
                //}
            });

            //function calcScalingFactor() {
            //    var maxSinkValue = 0;
            //    sinkNodes.forEach(function(node) {
            //        if (node.value > maxSinkValue) { maxSinkValue = node.value; }
            //    });
            //    return sinkNodeSize / maxSinkValue;
            //}
        }

        function spreadOriginNodes() {
            var origins = [];
            nodes.values().forEach(function (node) {
                if (node.type == "origin") {
                    origins.push(node);
                }
            });
            var totalHeight = (origins.length - 1) * nodePadding;
            origins.forEach(function (node) {
                totalHeight += node.dy;
            });
            var atHeight = (size[1] - totalHeight) / 2;
            origins.forEach(function (node) {
                node.y = atHeight;
                atHeight += node.dy + nodePadding;
            });
        }

        function spreadSinkNodes() {
            var atHeight = nodePadding;
            sinkNodes.forEach(function (node) {
                node.y = atHeight;
                atHeight += sinkNodeSize + nodePadding;
            });
        }

        function relaxLeftToRight(alpha) {
            nodesByBreadth.forEach(function (nodes) {
                nodes.forEach(function (node) {
                    if (node.type == "energytype" || node.type == "process") {
                        var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
                        node.y += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedSource(link) {
                return center(link.source) * link.value;
            }
        }

        function relaxRightToLeft(alpha) {
            nodesByBreadth.slice().reverse().forEach(function (nodes) {
                nodes.forEach(function (node) {
                    if (node.type == "energytype" || node.type == "process") {
                        var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
                        node.y += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedTarget(link) {
                return center(link.target) * link.value;
            }
        }

        function resolveCollisions() {
            nodesByBreadth.forEach(function (nodes) {
                var node,
                    dy,
                    y0 = 0,
                    n = nodes.length,
                    i;

                // Push any overlapping nodes down.
                nodes.sort(ascendingDepth);
                for (i = 0; i < n; ++i) {
                    node = nodes[i];
                    dy = y0 - node.y;
                    if (dy > 0) {
                        node.y += dy;
                    }
                    y0 = node.y + node.dy + nodePadding;
                }

                // If the bottommost node goes outside the bounds, push it back up.
                dy = y0 - (nodePadding + size[1]);
                if (dy > 0) {
                    y0 = node.y -= dy;

                    // Push any overlapping nodes back up.
                    for (i = n - 2; i >= 0; --i) {
                        node = nodes[i];
                        dy = node.y + node.dy + nodePadding - y0;
                        if (dy > 0) {
                            node.y -= dy;
                        }
                        y0 = node.y;
                    }
                }
            });
        }

        function ascendingDepth(a, b) {
            return a.y - b.y;
        }
    }

    function computeLinkDepths() {
        nodes.values().forEach(function (node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });
        nodes.values().forEach(function (node) {
            var sy = 0, ty = 0;
            node.sourceLinks.forEach(function (link) {
                link.sy = sy;
                sy += link.dy;
            });
            node.targetLinks.forEach(function (link) {
                link.ty = ty;
                ty += link.dy;
            });
        });

        function ascendingSourceDepth(a, b) {
            return a.source.y - b.source.y;
        }

        function ascendingTargetDepth(a, b) {
            return a.target.y - b.target.y;
        }
    }

    //function computeExportNodeBreadths() {
    //    exportLinks.forEach(function(link) {
    //        //var newNode = jQuery.extend(true, {}, exportNode);
    //        var newNode = Object.create(exportNode);
    //        exportNode.dy = 10;
    //        console.log(exportNode);
    //        //var newNode = JSON.parse( JSON.stringify(exportNode) );
    //        newNode.x = link.source.x + 50;
    //        newNode.y = size[1] - nodePadding;
    //        newNode.dy = 10;
    //        newNode.name = "Export" + link.target.name;
    //        nodes.set(newNode.name, newNode);
    //        // create a node
    //        // compute it's position
    //        // compute the links height.
    //    });
    //}

    /* Input for this method should be the enter set of a data join */
    function createNewLinks(links) {

        var groupElement = links.append("g")
            .attr("class", "link")
            .on("mouseenter", function (d) {
                d3.select(this).moveToFront()
                    .select(".link-text").moveToFront()
                    .attr("visibility", "visible");
            })
            .on("mouseleave", function (d) {
                d3.select(this).select(".link-text").attr("visibility", "hidden");
            });

        groupElement
            .append("path")
            .attr("d", path)
            .attr("stroke-width", function(d) { return Math.max(1, d.dy); })
            .attr("stroke", function (d) {
                if (d.target.color) return d.target.color;
                else return d.source.color;
            })
            .attr("fill", "none")
            .style("opacity", OPACITY.LINK_DEFAULT)
            .on("mouseenter", function (d) {
                d3.select(this).style("opacity", OPACITY.LINK_HIGHLIGHT);
            })
            .on("mouseleave", function (d) {
                d3.select(this).style("opacity", OPACITY.LINK_DEFAULT);
            });

        var textElements = groupElement
            .append("text")
            .attr("class", "link-text")
            .attr("visibility","hidden");

        setLinkText(textElements);
    }

    /* Input for this method should be the enter set of a data join */
    function createNewNodes(nodes) {
        nodes.append("rect")
            .attr("class", "node")
            .attr("height", function(d) {return d.dy;})
            .attr("width", function (d) { return d.dx;})
            .attr("stroke", function (d) { if(!d.color) return "black";})
            .style("fill", function (d) {
                if (d.color) return d.color;
                else return "url(#" + d.name.replace(/\s/g, "-") + ")";
            })
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .style("opacity", OPACITY.NODE_DEFAULT)
            .call(d3.behavior.drag()
                .origin(function (d) { return d; })
                .on("dragstart", function () { this.parentNode.appendChild(this); })
                .on("drag", dragmove))
            .on("mouseenter", function (node) {
                restoreLinksAndNodes();
                fadeUnconnected(node);
                showTextOfConnectedLinks(node);
            })
            .on("mouseleave", function (node) {
                restoreLinksAndNodes();
                hideTextOfConnectedLinks(node);
            });

        function dragmove(d) {
            d.x = Math.max(0, Math.min(size[0] - d.dx, d3.event.x));
            d.y = Math.max(0, Math.min(size[1] - d.dy, d3.event.y));
            d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
            sankey.relayout();

            linkSelection.select("path").attr("d", path);
        }

        function restoreLinksAndNodes() {
            linkSelection.select("path")
                .transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.LINK_DEFAULT);

            nodeSelection
                .transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.NODE_DEFAULT);
        }

        function fadeUnconnected(node) {
            linkSelection.filter(function (d) { return d.source !== node && d.target !== node; }).select("path")
                .transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.LINK_FADED);

            nodeSelection.filter(function (d) { return (d.name === node.name) ? false : !connected(d, node); })
                .transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.NODE_FADED);
        }

        function showTextOfConnectedLinks(node) {
            linkSelection.filter(function(d) {
                return (node.sourceLinks.indexOf(d) > -1) || (node.targetLinks.indexOf(d) > -1);}).select("text")
                .attr("visibility", "visible");
        }

        function hideTextOfConnectedLinks(node) {
            linkSelection.filter(function(d) {
                return (node.sourceLinks.indexOf(d) > -1) || (node.targetLinks.indexOf(d) > -1);}).select("text")
                .attr("visibility", "hidden");
        }
    }

    function computeConnectedNodes() {
        var sourceNode, targetNode;
        links.forEach(function (link) {
            sourceNode = link.source;
            targetNode = link.target;
            if (sourceNode.connectedNodes.indexOf(targetNode) < 0) {
                sourceNode.connectedNodes.push(targetNode);
            }
            if (targetNode.connectedNodes.indexOf(sourceNode) < 0) {
                targetNode.connectedNodes.push(sourceNode);
            }
        });
    }

    function setLinkText(textElements) {
        textElements
            .attr("text-anchor", function(d) {
                if (d.target.type == NODETYPES.SINK) { return "end";}
                if (d.source.type == NODETYPES.ORIGIN) { return "start";}
            })
            .attr("x", function(d) {
                if (d.target.type == NODETYPES.SINK) { return d.target.x; }
                if (d.source.type == NODETYPES.ORIGIN) { console.log(nodeWidth); return nodeWidth;}
            })
            .attr("y", function(d) {
                if (d.target.type == NODETYPES.SINK) { return d.target.y + d.ty + d.dy/2; }
                if (d.source.type == NODETYPES.ORIGIN) { return d.source.y + d.sy + d.dy/2;}
            })
            .attr("dy", ".35em")
            .attr("font-size", "14")
            .attr("pointer_events", "none")
            .text(function (d) {
                return formatNumber(d.value);
            });
    }

    function formatNumber(number) {
        return d3.format(">,d")(number);
    }

    function center(node) {
        return node.y + node.dy / 2;
    }

    function value(link) {
        return link.value;
    }

    function connected(n1, n2) {
        return n1.connectedNodes.indexOf(n2) >= 0;
    }

    /**
     * Set up the properties of the node
     */
    function initializeNode(node) {
        node.sourceLinks = [];
        node.targetLinks = [];
        node.connectedNodes = [];
    }

    return sankey;
};
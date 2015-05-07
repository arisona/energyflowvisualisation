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
    NODE_DEFAULT: 0.7,
    NODE_FADED: 0.2,
    NODE_HIGHLIGHT: 0.8,
    LINK_DEFAULT: 0.6,
    LINK_FADED: 0.05,
    LINK_HIGHLIGHT: 0.9
};

var TRANSITION_DURATION = 400;

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
    //exportLinks = [],
    //exportNodes = [],
    //exportNode,
        minNodeHeight = nodeWidth,
        minLinkHeight = 3,
    // the d3 selection of the widget that contains this sankey.
        widgetRoot,
        linkSelection,
        nodeSelection,
        tooltip;

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
        nodes = d3.map(newNodes, function (d) {
            return d.name;
        });
        return sankey;
    };

    sankey.links = function (newLinks) {
        if (!arguments.length) return links;
        //for (var i = 0; i < newLinks.length; i++) {
        //if (newLinks[i].target == "Export") {
        //    exportLinks.push(newLinks[i]);
        //}
        //}
        links = newLinks;
        return sankey;
    };

    sankey.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
    };

    var calcPath = function () {
        var e = .5;

        function path(pathType, link) {
            var r = link.source.x + link.source.dx,
                i = link.target.x,
                s = d3.interpolateNumber(r, i),
                o = s(e),
                u = s(1 - e),
                a = link.source.y + link.sy,
                f = link.target.y + link.ty,
                l = link.source.y + link.sy + link.dy,
                c = link.target.y + link.ty + link.dy;

            switch (pathType) {
                case 0:
                    return "M" + r + "," + a + "L" + r + "," + (a + link.dy);
                case 1:
                    return "M" + r + "," + a + "C" + o + "," + a + " " + u + "," + f + " " + i + "," + f +
                        "L" + i + "," + c + "C" + u + "," + c + " " + o + "," + l + " " + r + "," + l + "Z";
                case 2:
                    return "M" + i + "," + f + "L" + i + "," + (f + link.dy)
            }
        }

        return function (pathType) {
            return function (link) {
                return path(pathType, link);
            }
        };
    };

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
            .attr("height", size[1])
            .style("border", "solid 1px balck")
            .append("g").attr("id", "sankey");

        getYearsAvailable(createDiagram);

        // callback function that receives the available years form the server and reatrieves the energy data for that year.
        function createDiagram(years) {

            loadEnergyData(years[0], createDiagram);

            // callback function receives the energy data from the server.
            function createDiagram(graph) {
                sankey.nodes(graph["nodes"]);
                sankey.links(graph["links"]);
                sankey.layout(300);
                computeConnectedNodes();

                createSVGPatterns();

                // create the tooltip element
                tooltip = d3.select(widgetRoot).select("svg").append("div")
                    .attr("id", "tooltip")
                    .style("opacity", 0);

                tooltip.append("p").attr("id", "tooltip-text");

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

                function createSVGPatterns() {
                    // create patterns in the chart's defs element.
                    var patterns = d3.select(widgetRoot).select("svg").append("defs").selectAll(".pattern")
                        .data(sankey.nodes().values())
                        .enter()
                        .append("pattern")
                        .attr("id", function (d) {
                            return d.name;
                        })
                        .attr("class", "pattern")
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
    };

    sankey.updateDiagram = function (graph) {
        sankey.links(graph["links"]);
        sankey.nodes(graph["nodes"]);
        sankey.layout(300);

        /* update links */
        var links = d3.select(widgetRoot).select("svg").select(".links")
            .selectAll(".link")
            // The link data elements are identified by the concatenation of the source and target name.
            .data(sankey.links(), function (d) {
                return d.source.name + d.target.name;
            });

        /* transition updated links */
        links.select(".path0").transition().attr("d", path(0));
        links.select(".path1").transition().attr("d", path(1));
        links.select(".path2").transition().attr("d", path(2));

        /* remove links that are not present in the new data */
        links.exit().remove();

        /* create links that are in the new and not in the old data*/
        createNewLinks(links.enter());

        /* update nodes */
        var nodeJoin = d3.select(widgetRoot).select("svg").select(".nodes")
            .selectAll(".node")
            // The node data elements are identified by the name of the node.
            .data(sankey.nodes().values(), function (d) {
                return d.name;
            });

        /* transition updated nodes */
        nodeJoin.transition()
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        nodeJoin.select(".node").transition()
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth());
        nodeJoin.select(".energytype").transition()
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth());
        /* not creating any new nodes because all possible nodes should have been provided on first loading the tool */
        /* not removing any new nodes because all possible nodes should be displayed even if they don't have any links */
    };

    sankey.redrawDiagram = function () {
        var links = d3.select(widgetRoot).select("svg").select(".links")
            .selectAll(".link")
            // The link data elements are identified by the concatenation of the source and target name.
            .data(sankey.links(), function (d) {
                return d.source.name + d.target.name;
            });
        /* transition updated links */
        links.select(".path0").attr("d", path(0));
        links.select(".path1").attr("d", path(1));
        links.select(".path2").attr("d", path(2));

        var nodesToUpdate = d3.select(widgetRoot).select("svg").select(".nodes")
            .selectAll(".node")
            .data(sankey.nodes().values(), function (d) {
                return d.name;
            });

        nodesToUpdate
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        nodesToUpdate.select("rect")
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth());
    };

    sankey.layout = function (iterations) {
        computeNodeLinks();
        computeNodeValues();
        computeNodeBreadths();
        computeNodeDepths(iterations);
        computeLinkDepths();
        //computeExportNodeBreadths();
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
            //if (node.name == "Export") {
            //    // Remove export node from nodes before breadth and depth are calculated.
            //    nodes.remove("Export");
            //    exportNode = node;
            //}
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
            // calculate the scaling
            // TODO incorporate an absolute scaling over all possible scenarios.
            var ky = d3.min(nodesByBreadth, function (nodes) {
                return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
            });

            nodesByBreadth.forEach(function (nodes) {
                nodes.forEach(function (node, i) {
                    node.y = i;
                    node.dy = node.value * ky;
                    // if node with an image doesn't have minimum height it is assigned the minimum height and the
                    // originally calculated height is saved as an property to the node for later use.
                    if (node.dy < minNodeHeight && node.type != "energytype") {
                        node.originalDy = node.dy;
                        node.dy = minNodeHeight;
                    }
                });
            });

            links.forEach(function (link) {
                link.dy = link.value * ky;
                // Adjust the links height to the minimum and enlarge the connected nodes if the extra height of the
                // link exceeds the height of the nodes.
                if (link.dy < minLinkHeight) {
                    var oldDy = link.dy;
                    link.dy = minLinkHeight;
                    if (!link.source.originalDy) {
                        link.source.dy += link.dy - oldDy;
                    } else {
                        if (link.source.originalDy + (link.dy - oldDy) > link.source.dy) {
                            link.source.dy += link.dy - oldDy;
                        }
                    }
                    if (!link.target.originalDy) {
                        link.target.dy += link.dy - oldDy;
                    } else {
                        if (link.target.originalDy + (link.dy - oldDy) > link.target.dy) {
                            link.target.dy += link.dy - oldDy;
                        }
                    }
                }
            });
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
            var sinks = [];
            nodes.values().forEach(function (node) {
                if (node.type == "sink") {
                    sinks.push(node);
                }
            });
            var totalHeight = (sinks.length - 1) * nodePadding;
            sinks.forEach(function (node) {
                totalHeight += node.dy;
            });
            var atHeight = (size[1] - totalHeight) / 2;
            sinks.forEach(function (node) {
                node.y = atHeight;
                atHeight += node.dy + nodePadding;
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

    function formatNumber(number) {
        return d3.format(">,d")(number);
    }

    /* Input for this method should be the enter set of a data join */
    function createNewLinks(links) {
        links = links
            .append("g")
            .attr("class", "link")
            .attr("fill", function (d) {
                if (d.target.color) return d.target.color;
                else return d.source.color;
            })
            .style("opacity", OPACITY.LINK_DEFAULT)
            .on("mouseenter", function(d) {
                d3.select(this)
                    //.transition().duration(TRANSITION_DURATION)
                    .style("opacity", OPACITY.LINK_HIGHLIGHT);
            })
            .on("mouseleave", function(d) {
                d3.select(this)
                    //.transition().duration(TRANSITION_DURATION)
                    .style("opacity", OPACITY.LINK_DEFAULT);
            });

        links.append("text");


        links.append("path").attr("class", "path0").attr("d", path(0));
        links.append("path").attr("class", "path1").attr("d", path(1))
            .on("mouseenter", function (d) {
                //if (!mouseDown) {
                d3.select(this).append("text")
                    .attr("x", (d.source.x + d.target.x) / 2)
                    .attr("y", pathtext)
                    .attr("class", "link-text")
                    .attr("text-anchor", "middle")
                    .attr("dy", ".35em")
                    .attr("pointer_events", "none")
                    .text(function (d) {
                        return formatNumber(d.value);
                    });
                //}
            })
            .on("mouseleave", function (d) {
                d3.select(this).select(".link-text").remove();
            });
        links.append("path").attr("class", "path2").attr("d", path(2));
    }

    /* Input for this method should be the enter set of a data join */
    function createNewNodes(nodes) {
        var nodeGroupElement = nodes.append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .style("background-color", "white")
            .style("opacity", OPACITY.NODE_DEFAULT)
            .call(d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", function () {
                    this.parentNode.appendChild(this);
                })
                .on("drag", dragmove))
            .on("mouseover", function (node) {
                restoreLinksAndNodes();
                highlightConnected(node);
                fadeUnconnected(node);
                d3.select(this).style("opacity", OPACITY.NODE_HIGHLIGHT);
                tooltip
                    .style("left", node.x + "px")
                    .style("top", node.y + node.dy + 15 + "px")
                    //.transition().duration(TRANSITION_DURATION)
                    .style("opacity", 1).select("#tooltip-text")
                    .text(function () {
                        return node.name + "\nFlow: " + formatNumber(node.value);
                    });
            })
            .on("mouseleave", function () {
                tooltip
                    .style("opacity", 0);
                restoreLinksAndNodes();
            });

        nodeGroupElement.append("rect")
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", function (d) {
                return d.dx;
            })
            .attr("class", function (d) {
                if (d.color) return "energytype";
                else return "node";
            })
            .attr("stroke", function (d) {
                if (d.color) return d.color;
                else return "black";
            })
            .style("fill", function (d) {
                if (d.color) return d.color;
                else return "url(#" + d.name + ")";
            });

        function dragmove(d) {
            d.x = Math.max(0, Math.min(size[0] - d.dx, d3.event.x));
            d.y = Math.max(0, Math.min(size[1] - d.dy, d3.event.y));
            d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
            sankey.relayout();

            var links = d3.selectAll(".link");
            links.select(".path0").attr("d", path(0));
            links.select(".path1").attr("d", path(1));
            links.select(".path2").attr("d", path(2));
        }

        function highlightConnected(node) {
            linkSelection.filter(function (d) {
                return d.source === node;
            })
                .style("opacity", OPACITY.LINK_HIGHLIGHT);

            linkSelection.filter(function (d) {
                return d.target === node;
            })
                .style("opacity", OPACITY.LINK_HIGHLIGHT);
        }

        function restoreLinksAndNodes() {
            linkSelection
                //.transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.LINK_DEFAULT);

            nodeSelection
                //.transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.NODE_DEFAULT);
        }

        function fadeUnconnected(node) {
            linkSelection.filter(function (d) {
                return d.source !== node && d.target !== node;
            })
                //.transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.LINK_FADED);

            nodeSelection.filter(function (d) {
                return (d.name === node.name) ? false : !connected(d, node);
            })
                //.transition().duration(TRANSITION_DURATION)
                .style("opacity", OPACITY.NODE_FADED);
        }
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
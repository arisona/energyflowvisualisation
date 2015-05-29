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

/**
 * Extending the d3 selection object with a function that moves the dom elements of a selection to the front.
 */
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

/**
 * The possible node types.
 * ORIGIN: the nodes that have only target links.
 * ENERGYTYPE: the nodes that represent an energy type.
 * PROCESS: the nodes that represent stages in which the energytypes are processed.
 * SINK: the nodes that have only source links.
 */
var NODETYPES = {
    ORIGIN: "origin",
    ENERGYTYPE: "energytype",
    PROCESS: "process",
    SINK: "sink"
};

/**
 * Sets up and returns the sankey object. The sankey needs
 * @returns {Object} the sankey object
 */
EnergyTool.sankey = function () {
    /**
     * Opacity values used on the nodes and links html elements.
     */
    var OPACITY = {
        NODE_DEFAULT: 1,
        NODE_FADED: 0.2,
        LINK_DEFAULT: 0.4,
        LINK_FADED: 0.05,
        LINK_HIGHLIGHT: 0.9
    };

    /**
     * Transition duration of the fading and poping back up of the nodes and links when hovering over a node.
     */
    var TRANSITION_DURATION = 400;

    var sankey = {},
        size,
        nodeWidth,
        nodePadding,
        sinkNodeSize,
        maxSinkValue,
        textSize,
        nodes = [],
        links = [],
        /* list of the sink nodes */
        sinkNodes,
        /* d3 selection of the svg element in which this sankey is drawn. */
        svg,
        /* d3 selection of all link elements */
        linkSelection,
        /* d3 selection of all node elements */
        nodeSelection;

    // Setters and Getters

    sankey.svg = function (_) {
        if (!arguments.length) return svg;
        svg = _;
        return sankey;
    };

    sankey.nodeWidth = function (_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
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
            node.sourceLinks = [];
            node.targetLinks = [];
            node.connectedNodes = [];
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
        // XXX Calculate the node width, node padding
        nodeWidth = 0.02*size[0];
        return sankey;
    };

    sankey.textSize = function(_) {
        if (!arguments.length) return textSize;
        textSize = _;
        // XXX Node padding and text size dependency not final.
        nodePadding = textSize + 4;
        return sankey;
    };

    sankey.maxSinkValue = function(_) {
        if (!arguments.length) return maxSinkValue;
        maxSinkValue = _;
        return sankey;
    };

    var path = calcPath();

    /**
     *
     * @param graph
     * @returns {{}}
     */
    sankey.create = function (graph) {
        svg.attr("width", size[0])
            .attr("height", size[1]);

        sankey.nodes(graph["nodes"]);
        sankey.links(graph["links"]);
        layout(300);
        computeConnectedNodes();
        createSVGPatterns();

        /* create links */
        linkSelection = svg
            .selectAll(".link")
            .data(sankey.links());

        createNewLinks(linkSelection.enter());

        /* create nodes */
        nodeSelection = svg
            .append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(sankey.nodes().values());

        createNewNodes(nodeSelection.enter());

        function createSVGPatterns() {
            // create patterns in the chart's defs element.
            var patterns = svg
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
        return sankey;
    };

    sankey.update = function (graph) {
        sankey.links(graph["links"]);
        sankey.nodes(graph["nodes"]);
        layout(300);
        computeConnectedNodes();

        /* update links */
        var links = svg.selectAll(".link")
            // The link data elements are identified by the concatenation of the source and target name.
            .data(sankey.links(), function (d) {
                return d.source.name + d.target.name;
            });

        /* transition updated links */
        links.select("path").transition()
            .attr("d", path)
            .attr("stroke-width", function(d) { return d.dy; });
        adjustLinkTexts(links);

        /* remove links that are not present in the new data */
        links.exit().remove();

        /* create links that are in the new and not in the old data*/
        createNewLinks(links.enter());

        /* update nodes */
        var nodeJoin = svg.select(".nodes")
            .selectAll(".node")
            // The node data elements are identified by the name of the node.
            .data(sankey.nodes().values(), function (d) { return d.name; });

        /* transition updated nodes */
        nodeJoin.select("rect").transition()
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr("height", function (d) { return d.dy; })
            .attr("width", sankey.nodeWidth());
        adjustNodeTexts(nodeJoin);

        /* not creating any new nodes because all possible nodes should have been provided on first loading the tool */
        /* not removing any new nodes because all possible nodes should be displayed even if they don't have any links */
        return sankey;
    };

    function layout(iterations) {
        sinkNodeSize = (size[1] - ((sinkNodes.length+1) * nodePadding)) / sinkNodes.length;
        computeNodeLinks();
        computeNodeValues();
        computeNodeBreadths();
        computeNodeDepths(iterations);
        computeLinkDepths();
        return sankey;
    };

    function relayout (iterations) {
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

            nodesByBreadth.forEach(function (nodes) {
                nodes.forEach(function (node, i) {
                    node.y = i;
                    node.dy = node.value * ky;
                    // if the node is a process and doesn't have minimum height it is assigned the minimum height and the
                    // originally calculated height is saved as an property to the node for later use.
                    if (node.dy < nodeWidth && node.type == NODETYPES.PROCESS) {
                        node.dy = nodeWidth;
                    }
                    if (node.type == NODETYPES.SINK) {
                        node.dy = sinkNodeSize;
                    }
                });
            });

            links.forEach(function (link) {
                link.dy = link.value * ky;
            });
        }

        function spreadOriginNodes() {
            var origins = [];
            nodes.values().forEach(function (node) {
                if (node.type == "origin") {
                    origins.push(node);
                }
            });
            // highest and lowest node shall have padding to the edges of the canvas
            var totalHeight = (origins.length + 1) * nodePadding;
            origins.forEach(function (node) {
                totalHeight += node.dy;
            });
            var newPadding = (size[1] - totalHeight) / (origins.length-1);
            //var atHeight = (size[1] - totalHeight) / 2;
            var atHeight = nodePadding;
            origins.forEach(function (node) {
                node.y = atHeight;
                atHeight += node.dy + newPadding;
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

    /* Input for this method should be the enter set of a data join */
    function createNewLinks(enterSelection) {

        var links = enterSelection.append("g")
            .attr("class", "link")
            .on("mouseenter", function (d) {
                d3.select(this).selectAll("text")
                    .attr("visibility", "visible");
                d3.select(this).select("path").transition().duration(0)
                    .style("opacity", OPACITY.LINK_HIGHLIGHT);
                d3.select(this).moveToFront();
            })
            .on("mouseleave", function (d) {
                d3.select(this).selectAll("text")
                    .attr("visibility", "hidden");
                d3.select(this).select("path")
                    .style("opacity", OPACITY.LINK_DEFAULT);
                d3.select(".nodes").moveToFront();
            });

        links
            .append("path")
            .attr("d", path)
            .attr("stroke-width", function(d) { return Math.max(1, d.dy); })
            .attr("stroke", function (d) {
                if (d.target.color) return d.target.color;
                else return d.source.color;
            })
            .style("opacity", OPACITY.LINK_DEFAULT)
            .attr("fill", "none");

        links
            .append("text")
            .attr("class", "atsource-text")
            .style("pointer-events", "none")
            .attr("visibility","hidden");

        links
            .append("text")
            .attr("class", "attarget-text")
            .style("pointer-events", "none")
            .attr("visibility","hidden");

        adjustLinkTexts(links);
    }

    /* Input for this method should be the enter set of a data join */
    function createNewNodes(enterSelection) {
        var nodes = enterSelection.append("g")
            .attr("class", "node")
            .on("mouseenter", function (node) {
                restoreLinksAndNodes();
                fadeUnconnected(node);
                showTextOfConnectedLinks(node);
                showNodeText(d3.select(this));
            })
            .on("mouseleave", function (node) {
                restoreLinksAndNodes();
                hideTextOfConnectedLinks(node);
                hideNodeText(d3.select(this));
            })
            .call(d3.behavior.drag()
                .origin(function (d) { return d; })
                .on("dragstart", function () { this.parentNode.appendChild(this); })
                .on("drag", dragmove)
            );

        nodes.append("rect")
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr("height", function(d) {return d.dy;})
            .attr("width", function (d) { return d.dx;})
            .attr("stroke", function (d) { if(!d.color) return "black";})
            .style("fill", function (d) {
                if (d.color) return d.color;
                else return "url(#" + d.name.replace(/\s/g, "-") + ")";
            })
            .style("opacity", OPACITY.NODE_DEFAULT);

        nodes.append("text")
            .attr("class", "node-text")
            .attr("visibility", "hidden");

        adjustNodeTexts(nodes);

        function dragmove(d) {
            d.x = Math.max(0, Math.min(size[0] - d.dx, d3.event.x));
            d.y = Math.max(0, Math.min(size[1] - d.dy, d3.event.y));
            d3.select(this).select("rect").attr("transform", "translate(" + d.x + "," + d.y + ")");
            relayout();
            linkSelection.select("path").attr("d", path);
            adjustLinkTexts(linkSelection);
            adjustNodeTexts(d3.select(this));
        }

        function restoreLinksAndNodes() {
            linkSelection
                .transition().duration(TRANSITION_DURATION).select("path")
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
            linkSelection.filter(function(d) { return node.sourceLinks.indexOf(d) > -1; })
                .select(".attarget-text")
                .attr("visibility", "visible");
            linkSelection.filter(function(d) { return node.targetLinks.indexOf(d) > -1; })
                .select(".atsource-text")
                .attr("visibility", "visible");
        }

        function hideTextOfConnectedLinks(node) {
            linkSelection.filter(function(d) { return node.sourceLinks.indexOf(d) > -1; }).select(".attarget-text")
                .attr("visibility", "hidden");
            linkSelection.filter(function(d) { return node.targetLinks.indexOf(d) > -1; }).select(".atsource-text")
                .attr("visibility", "hidden");
            d3.select(".nodes").moveToFront();
        }

        function showNodeText(node) {
            node.select(".node-text")
                .attr("visibility", "visible");
        }

        function hideNodeText(node) {
            node.select(".node-text")
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

    function adjustNodeTexts(nodes) {
        nodes.select(".node-text")
            .attr("text-anchor", function(d) {
                if (d.type == NODETYPES.ORIGIN) return "start";
                else if (d.type == NODETYPES.SINK) return "end";
                else return "middle";
            })
            .attr("x", function(d) {
                if (d.type == NODETYPES.ORIGIN) return d.x;
                else if (d.type == NODETYPES.SINK) return d.x + d.dx;
                else return d.x + d.dx / 2;
            })
            .attr("y", function(d) { return d.y; })
            .attr("dy", "-2")
            //.style("font-size", textSize)
            .text(function (d) { return formatNumber(d.value); });
    }

    function adjustLinkTexts(links) {
        links.select(".atsource-text")
            .attr("text-anchor", "start")
            .attr("x", function(d) { return d.source.x + nodeWidth; })
            .attr("y", function(d) { return d.source.y + d.sy + d.dy/2; })
            .attr("dy", ".35em")
            //.attr("font-size", textSize)
            .text(function (d) { return formatNumber(d.value); });

        links.select(".attarget-text")
            .attr("text-anchor", "end")
            .attr("x", function(d) { return d.target.x; })
            .attr("y", function(d) { return d.target.y + d.ty + d.dy/2; })
            .attr("dy", ".35em")
            //.attr("font-size", textSize)
            .text(function (d) { return formatNumber(d.value); });
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

    return sankey;
};
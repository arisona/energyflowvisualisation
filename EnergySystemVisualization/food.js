/*This software is released under the MIT License

 MIT License 2014 Denes Csala http://www.csaladen.es

 The following software uses the javascript frameworks below,
 all of which are distributed under the MIT or GNU/GPL license:
 D3.js http://d3js.org/  data-oriented javascript framework.
 - Sankey plugin http://bost.ocks.org/mike/sankey/ for D3.js (modified) by Mike Bostock,
 which is based on the initial version http://tamc.github.io/Sankey/ by Thomas Counsell.
 I have incorporated the ability to render Sankey cycles, as pioneered by https://github.com/cfergus
 - Dragdealer.js href="http://skidding.github.io/dragdealer/ by Ovidiu Chereches
 */

//<!--DATA INIT-->

var data = {"nodes": [], "links": []}

//<!--DATA ENTRY-->

nodesform = d3.select("#nodes-form");
function addnode() {
    nodesform.append("div").append("input").attr("value", "New Node");
}
function removenode() {
    nodesform[0][0].children[nodesform[0][0].children.length - 1].remove("div")
}
linksform = d3.select("#links-form");
function addlink() {
    linksform.append("div").append("input").attr("value", "0,1,0.52");
}
function removelink() {
    linksform[0][0].children[linksform[0][0].children.length - 1].remove("div")
}
function draw() {

    data = {"nodes": [], "links": []}

    for (i = 0; i < nodesform[0][0].children.length; i++) {
        data.nodes.push({"name": nodesform[0][0].children[i].children[0].value});
    }
    for (i = 0; i < linksform[0][0].children.length; i++) {
        var array = linksform[0][0].children[i].children[0].value.split(',');
        data.links.push({"source": parseInt(array[0]), "target": parseInt(array[1]), "value": parseFloat(array[2])});
    }
    change(data);
}
function save() {
    d3.select('#save').style('z-index', 100).transition().style('opacity', 0.9);
    st = '{"nodes":['
    for (i = 0; i < nodesform[0][0].children.length; i++) {
        st = st + '{"name":"' + nodesform[0][0].children[i].children[0].value + '"},';
    }
    st = st.substring(0, st.length - 1) + '],"links":[';
    for (i = 0; i < linksform[0][0].children.length; i++) {
        var array = linksform[0][0].children[i].children[0].value.split(',');
        st = st + '{"source":' + parseInt(array[0]) + ',"target":' + parseInt(array[1]) + ',"value":' + parseFloat(array[2]) + '},';
    }
    st = st.substring(0, st.length - 1) + ']}';
    d3.select('#savetext').text(st);
}
function load() {
    d3.select('#load').style('z-index', 100).transition().style('opacity', 0.9);
}
function loadsubmit() {
    d3.select('#load').transition().style('opacity', 0).style('z-index', -1);
    var loadtext = d3.select('#load')[0][0].children[1].value;
    if (loadtext != "") {
        //redraw
        var newdata = JSON.parse(loadtext);
        change(newdata);
        //remove existing node entry boxes
        var n = nodesform[0][0].children.length;
        for (i = 0; i < n; i++) {
            nodesform[0][0].children[0].remove("div");
        }
        //remove existing link entry boxes
        var n = linksform[0][0].children.length;
        for (i = 0; i < n; i++) {
            linksform[0][0].children[0].remove("div");
        }
        //add new node entry boxes
        for (i = 0; i < newdata.nodes.length; i++) {
            nodesform.append("div").append("input").attr("value", newdata.nodes[i].name);
        }
        //add new link entry boxes
        var newdata = JSON.parse(loadtext.substring(loadtext.indexOf('"links":[') + 8, loadtext.length - 1))
        for (i = 0; i < newdata.length; i++) {
            linksform.append("div").append("input").attr("value", newdata[i].source + "," + newdata[i].target + "," + newdata[i].value);
        }
    }
}

//<!--SANKEY DIAGRAM-->

var padding = 28;
var paddingmultiplier = 50;
var lowopacity = 0.3;
var highopacity = 0.7;
var format2Number = d3.format(",.2f"),
    formatNumber = d3.format(",.0f"),
    format = function (a) {
        return formatNumber(a)
    },
    format2 = function (a) {
        return format2Number(a)
    },
    color = d3.scale.category20();
d3.select("#chart").style("width", document.getElementById("chart").offsetWidth - sizecorrection)
d3.select("#titlebar").style("width", document.getElementById("titlebar").offsetWidth - sizecorrection)
var margin = {
        top: 70,
        right: 10,
        bottom: 30,
        left: 40
    },
    width = document.getElementById("chart").offsetWidth - margin.left - margin.right,
    height = document.getElementById("chart").offsetHeight - margin.bottom - 90;
var svg = d3.select("#chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height]);
var path = sankey.reversibleLink();
var change = function () {
};

change = function (d) {

    padding = paddingmultiplier * (1 - densityslider.getValue()[0]) + 3
    svg.selectAll("g").remove();
    sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height]);
    sankey.nodes(d.nodes).links(d.links).layout(500);
    var g = svg.append("g") //link
        .selectAll(".link").data(d.links).enter().append("g").attr("class", "link").sort(function (j, i) {
            return i.dy - j.dy
        });
    var h = g.append("path") //path0
        .attr("d", path(0));
    var f = g.append("path") //path1
        .attr("d", path(1));
    var e = g.append("path") //path2
        .attr("d", path(2));
    g.attr("fill", function (i) {
        return i.source.color = color(i.source.name.replace(/ .*/, ""))
    }).attr("opacity", lowopacity).on("mouseover", function (d) {
        d3.select(this).style('opacity', highopacity);
    }).on("mouseout", function (d) {
        d3.select(this).style('opacity', lowopacity);
    }).append("title") //link
        .text(function (i) {
            return i.source.name + " → " + i.target.name + "\n" + format2(i.value)
        });
    var c = svg.append("g") //node
        .selectAll(".node").data(d.nodes).enter().append("g").attr("class", "node").attr("transform", function (i) {
            return "translate(" + i.x + "," + i.y + ")"
        }).call(d3.behavior.drag().origin(function (i) {
            return i
        }).on("dragstart", function () {
            this.parentNode.appendChild(this)
        }).on("drag", b));
    c.append("rect") //node
        .attr("height", function (i) {
            return i.dy
        }).attr("width", sankey.nodeWidth()).style("fill", function (i) {
            return i.color = color(i.name.replace(/ .*/, ""))
        }).style("stroke", function (i) {
            return d3.rgb(i.color).darker(2)
        }).on("mouseover", function (d) {
            svg.selectAll(".link").filter(function (l) {
                return l.source == d || l.target == d;
            }).transition().style('opacity', highopacity);
        }).on("mouseout", function (d) {
            svg.selectAll(".link").filter(function (l) {
                return l.source == d || l.target == d;
            }).transition().style('opacity', lowopacity);
        }).on("dblclick", function (d) {
            svg.selectAll(".link").filter(function (l) {
                return l.target == d;
            }).attr("display", function () {
                if (d3.select(this).attr("display") == "none") return "inline"
                else return "none"
            });
        }).append("title").text(function (i) {
            return i.name + "\n" + format2(i.value)

        });
    c.append("text") //node
        .attr("x", -6).attr("y", function (i) {
            return i.dy / 2
        }).attr("dy", ".35em").attr("text-anchor", "end").attr("transform", null).text(function (i) {
            return i.name
        }).filter(function (i) {
            return i.x < width / 2
        }).attr("x", 6 + sankey.nodeWidth()).attr("text-anchor", "start")
    c.append("text") //node
        .attr("x", function (i) {
            return -i.dy / 2
        })
        .attr("y", function (i) {
            return i.dx / 2 + 6
        })
        .attr("transform", "rotate(270)").attr("text-anchor", "middle").text(function (i) {
            if (i.dy > 50) {
                return format(i.value);
            }
        }).attr("fill", "white").attr("stroke", "black");


    function b(i) { //dragmove
        if (document.getElementById("ymove").checked) {
            if (document.getElementById("xmove").checked) {
                d3.select(this).attr("transform", "translate(" + (i.x = Math.max(0, Math.min(width - i.dx, d3.event.x))) + "," + (i.y = Math.max(0, Math.min(height - i.dy, d3.event.y))) + ")")
            } else {
                d3.select(this).attr("transform", "translate(" + i.x + "," + (i.y = Math.max(0, Math.min(height - i.dy, d3.event.y))) + ")")
            }
        } else {
            if (document.getElementById("xmove").checked) {
                d3.select(this).attr("transform", "translate(" + (i.x = Math.max(0, Math.min(width - i.dx, d3.event.x))) + "," + i.y + ")")
            }
        }
        sankey.relayout();
        f.attr("d", path(1));
        h.attr("d", path(0));
        e.attr("d", path(2))
    };
};
draw();


////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

d3.sankey = function () {
    function u() {
        i.forEach(function (e) {
            e.sourceLinks = [];
            e.targetLinks = []
        });
        s.forEach(function (e) {
            var t = e.source, n = e.target;
            if (typeof t === "number")t = e.source = i[e.source];
            if (typeof n === "number")n = e.target = i[e.target];
            t.sourceLinks.push(e);
            n.targetLinks.push(e)
        })
    }

    function a() {
        i.forEach(function (e) {
            e.value = Math.max(d3.sum(e.sourceLinks, g), d3.sum(e.targetLinks, g))
        })
    }

    function f() {
        function n(r) {
            r.index = t++;
            r.lowIndex = r.index;
            r.onStack = true;
            e.push(r);
            if (r.sourceLinks) {
                r.sourceLinks.forEach(function (e) {
                    var t = e.target;
                    if (!t.hasOwnProperty("index")) {
                        n(t);
                        r.lowIndex = Math.min(r.lowIndex, t.lowIndex)
                    } else if (t.onStack) {
                        r.lowIndex = Math.min(r.lowIndex, t.index)
                    }
                });
                if (r.lowIndex === r.index) {
                    var i = [], s;
                    do {
                        s = e.pop();
                        s.onStack = false;
                        i.push(s)
                    } while (s != r);
                    o.push({root: r, scc: i})
                }
            }
        }

        var e = [], t = 0;
        i.forEach(function (e) {
            if (!e.index) {
                n(e)
            }
        });
        o.forEach(function (e, t) {
            e.index = t;
            e.scc.forEach(function (e) {
                e.component = t
            })
        })
    }

    function l() {
        function u(e) {
            return [].concat.apply([], e)
        }

        function a() {
            var e = o, t, n, r = 0;
            while (e.length) {
                t = [];
                n = {};
                e.forEach(function (e) {
                    e.x = r;
                    e.scc.forEach(function (r) {
                        r.sourceLinks.forEach(function (r) {
                            if (!n.hasOwnProperty(r.target.component) && r.target.component != e.index) {
                                t.push(o[r.target.component]);
                                n[r.target.component] = true
                            }
                        })
                    })
                });
                e = t;
                ++r
            }
        }

        function f(e, n) {
            var r = [e], i = 1, s = 0;
            var o = 0;
            while (i > 0) {
                var u = r.shift();
                i--;
                if (!u.hasOwnProperty("x")) {
                    u.x = o;
                    u.dx = t;
                    var a = n(u);
                    r = r.concat(a);
                    s += a.length
                }
                if (i == 0) {
                    o++;
                    i = s;
                    s = 0
                }
            }
        }

        a();
        o.forEach(function (e, t) {
            f(e.root, function (e) {
                var n = e.sourceLinks.filter(function (e) {
                    return e.target.component == t
                }).map(function (e) {
                    return e.target
                });
                return n
            })
        });
        var e = 0;
        var n = d3.nest().key(function (e) {
            return e.x
        }).sortKeys(d3.ascending).entries(o).map(function (e) {
            return e.values
        });
        var e = -1, s = -1;
        n.forEach(function (t) {
            t.forEach(function (t) {
                t.x = e + 1;
                t.scc.forEach(function (e) {
                    e.x = t.x + e.x;
                    s = Math.max(s, e.x)
                })
            });
            e = s
        });
        i.filter(function (e) {
            var t = e.sourceLinks.filter(function (e) {
                return e.source.name != e.target.name
            });
            return t.length == 0
        }).forEach(function (t) {
            t.x = e
        });
        p((r[0] - t) / Math.max(e, 1))
    }

    function c() {
        i.forEach(function (e) {
            if (!e.targetLinks.length) {
                e.x = d3.min(e.sourceLinks, function (e) {
                    return e.target.x
                }) - 1
            }
        })
    }

    function h(e) {
        i.forEach(function (t) {
            if (!t.sourceLinks.length) {
                t.x = e - 1
            }
        })
    }

    function p(e) {
        i.forEach(function (t) {
            t.x *= e
        })
    }

    function d(e) {
        function u() {
            var e = d3.min(t, function (e) {
                return (r[1] - (e.length - 1) * n) / d3.sum(e, g)
            });
            t.forEach(function (t) {
                t.forEach(function (t, n) {
                    t.y = n;
                    t.dy = t.value * e
                })
            });
            s.forEach(function (t) {
                t.dy = t.value * e
            })
        }

        function a(e) {
            function n(e) {
                return m(e.source) * e.value
            }

            t.forEach(function (t, r) {
                t.forEach(function (t) {
                    if (t.targetLinks.length) {
                        var r = d3.sum(t.targetLinks, n) / d3.sum(t.targetLinks, g);
                        t.y += (r - m(t)) * e
                    }
                })
            })
        }

        function f(e) {
            function n(e) {
                return m(e.target) * e.value
            }

            t.slice().reverse().forEach(function (t) {
                t.forEach(function (t) {
                    if (t.sourceLinks.length) {
                        var r = d3.sum(t.sourceLinks, n) / d3.sum(t.sourceLinks, g);
                        t.y += (r - m(t)) * e
                    }
                })
            })
        }

        function l() {
            t.forEach(function (e) {
                var t, i, s = 0, o = e.length, u;
                e.sort(c);
                for (u = 0; u < o; ++u) {
                    t = e[u];
                    i = s - t.y;
                    if (i > 0)t.y += i;
                    s = t.y + t.dy + n
                }
                i = s - n - r[1];
                if (i > 0) {
                    s = t.y -= i;
                    for (u = o - 2; u >= 0; --u) {
                        t = e[u];
                        i = t.y + t.dy + n - s;
                        if (i > 0)t.y -= i;
                        s = t.y
                    }
                }
            })
        }

        function c(e, t) {
            return e.y - t.y
        }

        var t = d3.nest().key(function (e) {
            return e.x
        }).sortKeys(d3.ascending).entries(i).map(function (e) {
            return e.values
        });
        u();
        l();
        for (var o = 1; e > 0; --e) {
            f(o *= .99);
            l();
            a(o);
            l()
        }
    }

    function v() {
        function e(e, t) {
            return e.source.y - t.source.y
        }

        function t(e, t) {
            return e.target.y - t.target.y
        }

        i.forEach(function (n) {
            n.sourceLinks.sort(t);
            n.targetLinks.sort(e)
        });
        i.forEach(function (e) {
            var t = 0, n = 0;
            e.sourceLinks.forEach(function (e) {
                e.sy = t;
                t += e.dy
            });
            e.targetLinks.forEach(function (e) {
                e.ty = n;
                n += e.dy
            })
        })
    }

    function m(e) {
        return e.y + e.dy / 2
    }

    function g(e) {
        return e.value
    }

    var e = {}, t = 24, n = 8, r = [1, 1], i = [], s = [], o = [];
    e.nodeWidth = function (n) {
        if (!arguments.length)return t;
        t = +n;
        return e
    };
    e.nodePadding = function (t) {
        if (!arguments.length)return n;
        n = +t;
        return e
    };
    e.nodes = function (t) {
        if (!arguments.length)return i;
        i = t;
        return e
    };
    e.links = function (t) {
        if (!arguments.length)return s;
        s = t;
        return e
    };
    e.size = function (t) {
        if (!arguments.length)return r;
        r = t;
        return e
    };
    e.layout = function (t) {
        u();
        a();
        f();
        l();
        d(t);
        v();
        return e
    };
    e.relayout = function () {
        v();
        return e
    };
    e.reversibleLink = function () {
        function t(t, n) {
            var r = n.source.x + n.source.dx, i = n.target.x, s = d3.interpolateNumber(r, i), o = s(e), u = s(1 - e), a = n.source.y + n.sy, f = n.target.y + n.ty, l = n.source.y + n.sy + n.dy, c = n.target.y + n.ty + n.dy;
            switch (t) {
                case 0:
                    return "M" + r + "," + a + "L" + r + "," + (a + n.dy);
                case 1:
                    return "M" + r + "," + a + "C" + o + "," + a + " " + u + "," + f + " " + i + "," + f + "L" + i + "," + c + "C" + u + "," + c + " " + o + "," + l + " " + r + "," + l + "Z";
                case 2:
                    return "M" + i + "," + f + "L" + i + "," + (f + n.dy)
            }
        }

        function n(e, t) {
            function i(e) {
                return e.source.y + e.sy > e.target.y + e.ty ? -1 : 1
            }

            function s(e, t) {
                return e + "," + t + " "
            }

            var n = 30;
            var r = 15;
            var o = i(t) * r, u = t.source.x + t.source.dx, a = t.source.y + t.sy, f = t.target.x, l = t.target.y + t.ty;
            switch (e) {
                case 0:
                    return "M" + s(u, a) + "C" + s(u, a) + s(u + n, a) + s(u + n, a + o) + "L" + s(u + n, a + o + t.dy) + "C" + s(u + n, a + t.dy) + s(u, a + t.dy) + s(u, a + t.dy) + "Z";
                case 1:
                    return "M" + s(u + n, a + o) + "C" + s(u + n, a + 3 * o) + s(f - n, l - 3 * o) + s(f - n, l - o) + "L" + s(f - n, l - o + t.dy) + "C" + s(f - n, l - 3 * o + t.dy) + s(u + n, a + 3 * o + t.dy) + s(u + n, a + o + t.dy) + "Z";
                case 2:
                    return "M" + s(f - n, l - o) + "C" + s(f - n, l) + s(f, l) + s(f, l) + "L" + s(f, l + t.dy) + "C" + s(f, l + t.dy) + s(f - n, l + t.dy) + s(f - n, l + t.dy - o) + "Z"
            }
        }

        var e = .5;
        return function (e) {
            return function (r) {
                if (r.source.x < r.target.x) {
                    return t(e, r)
                } else {
                    return n(e, r)
                }
            }
        }
    };
    e.link = function () {
        function t(t) {
            var n = t.source.x + t.source.dx, r = t.target.x, i = d3.interpolateNumber(n, r), s = i(e), o = i(1 - e), u = t.source.y + t.sy + t.dy / 2, a = t.target.y + t.ty + t.dy / 2;
            return "M" + n + "," + u + "C" + s + "," + u + " " + o + "," + a + " " + r + "," + a
        }

        var e = .5;
        t.curvature = function (n) {
            if (!arguments.length)return e;
            e = +n;
            return t
        };
        return t
    };
    return e
}
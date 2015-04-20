/*This software is released under the MIT License

 Copyright (C) 2014 Denes Csala http://www.csaladen.es

 This website accompanies the research paper entitled
 Food and Energy in the Global Sustainable Energy Transition:
 An Energy Metabolism View of Global Agriculture Systems
 by Sgouris Sgouridis & Denes Csala

 The following software extensively uses the javascript frameworks below,
 all of which are distributed under the MIT or GNU/GPL license:
 D3.js http://d3js.org/  data-oriented javascript framework.
 - Sankey plugin http://bost.ocks.org/mike/sankey/ for D3.js (heavily modified) by Mike Bostock's,
 which is based on the initial version http://tamc.github.io/Sankey/ by Thomas Counsell.
 I have incorporated the ability to render Sankey cycles, as pioneered by https://github.com/cfergus
 - NVD3 http://nvd3.org/ extension for D3.js by Novus Partners
 - Dragdealer.js href="http://skidding.github.io/dragdealer/ by Ovidiu Chereches
 */

/*Replace spaces by hyphens. ( - )  for TEXT to URL*/
String.prototype.stripSpaces = function(){ return this.replace(/\s/g,"-")}
/*Replace hyphens by spaces, for URL to TEXT */
String.prototype.addSpaces = function(){ return this.replace(/-/g," ")}
/*Replace commas by new lines */
String.prototype.addLines = function(){ return this.replace(/,/g,"\n")}
//<!--convert non-default URL-->

//set global database path

var datapath = "https://dl.dropboxusercontent.com/u/333992592/Food-Energy/"
//var datapath = "http://food.csaladen.es/"  //if data on github server
//var datapath = "http://localhost:7997/" //for local testing


//function to display content (from hash or menu)
function disp_content(a,hash){
    //hide all
    d3.select("#content").transition().style("opacity", 0);
    d3.select("#map").transition().style("opacity", 0);
    d3.select("#scatter").transition().style("opacity", 0);
    d3.select("#description").transition().style("opacity", 0);
    //send backwards
    d3.select("#content").style("z-index", -1);
    d3.select("#map").style("z-index", -1);
    d3.select("#scatter").style("z-index", -1);
    d3.select("#description").style("z-index", -1);
    //set title
    var text="Sankey Diagram";
    if (a=="#map") {text="World Map"};
    if (a=="#scatter") {text="Data Plots"};
    if (a=="#description") {text="Description"};
    d3.select("#titletext").text("Food Energy Flows "+text);
    //show and bring forward
    d3.select(a).transition().style("opacity", 1);
    d3.select(a).style("z-index", 0);
    window.location.hash=hash;
}

//window.location.hash = "&10&1998&~-World" //set this if you want a predefined destination
var myhash=window.location.hash.addSpaces()
var inithash=myhash;
if ((myhash=="#&map")||(myhash=="#&description")||(myhash=="#&scatter")) {
    myhash="";
}
var myindex=myhash.slice(2,4)
var myyear=myhash.slice(5,9)
var mycountry=myhash.slice(10,myhash.length)

//<!--PIE CHARTS-->

var widepie = Math.max(220, parseInt(d3.select("#mypie").style("width")));
var highpie = parseInt(d3.select("#mypie").style("height"));
var mbottom = 0;
var one = true;
d3.select("#mypie2").style("width", widepie / 2)
d3.select("#mypie2").style("margin-right", widepie / 2 + 10)
var piewidth = widepie

function updatepie(data, placeholder, placelabel1, placelabel2, pievalue, flow) {
    one = flow
    if (flow) {
        piewidth = widepie
        mbottom = 285 + 25
    } else {
        piewidth = widepie / 2
        mbottom = 285 + 40
    }
    if (document.getElementById("legend").checked) {
        nv.addGraph(function() {
            var chart = nv.models.pieChart().x(function(d) {
                return d.l
            }).y(function(d) {
                return d.v
            })
                .showLabels(true) //Display pie labels
                .labelThreshold(.05) //Configure the minimum slice size for labels to show up
                .labelType("percent") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
                .donut(true) //Turn on Donut mode.
                .donutRatio(0.35) //Configure how big you want the donut hole size to be.
            d3.select(placeholder).style("width", piewidth)
            d3.select(placeholder).style("height", highpie - mbottom)
            d3.select(placeholder).style("margin-bottom", mbottom)
            d3.selectAll(placeholder + " svg").selectAll(".centerpielabel").remove()
            d3.selectAll(placeholder + " svg").append("text").attr("x", parseInt(d3.select(placeholder).style("width")) / 2).attr("y", parseInt(d3.select(placeholder).style("height")) - parseInt(d3.select(placeholder).style("width")) / 2 - 10).attr("class", "centerpielabel").text(placelabel1)
            d3.selectAll(placeholder + " svg").append("text").attr("x", parseInt(d3.select(placeholder).style("width")) / 2).attr("y", parseInt(d3.select(placeholder).style("height")) - parseInt(d3.select(placeholder).style("width")) / 2 + 4).attr("class", "centerpielabel").text(placelabel2)
            if (supplyselected) {
                var pietext = format(pievalue)
            } else {
                var pietext = format2(pievalue)
            }
            d3.selectAll(placeholder + " svg").append("text").attr("x", parseInt(d3.select(placeholder).style("width")) / 2).attr("y", parseInt(d3.select(placeholder).style("height")) - parseInt(d3.select(placeholder).style("width")) / 2 + 18).attr("class", "centerpielabel").text(pietext)
            d3.select(placeholder + " svg").datum(data).transition().duration(350).call(chart)
            return chart;
        });
    }
}

function updpieleg() {
    if (document.getElementById("legend2").checked) {
        d3.selectAll(".nv-legend").attr("display", "inline");
    } else {
        d3.selectAll(".nv-legend").attr("display", "none");
    }
}

function updpievis() {
    if (document.getElementById("legend").checked) {
        show("#mypie")
        document.getElementById("legend2").disabled = false;
        if (!one) show("#mypie2")
    } else {
        document.getElementById("legend2").disabled = true;
        hide(".pielegend")
    }
}

function show(placeholder) {
    if (document.getElementById("legend").checked) {
        d3.selectAll(placeholder + " svg").attr("display", "inline");
    }
}

function hide(placeholder) {
    d3.selectAll(placeholder + " svg").attr("display", "none");
}

//<!--DYNAMIC SELECTORS-->

function linearRegression(y,x){
    var lr = {};
    var n = y.length;
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    for (var i = 0; i < y.length; i++) {

        sum_x += x[i];
        sum_y += y[i];
        sum_xy += (x[i]*y[i]);
        sum_xx += (x[i]*x[i]);
        sum_yy += (y[i]*y[i]);
    }

    lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
    lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
    lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

    return lr;
}
var dropdown = d3.select("#json_sources");
var yearselect = d3.select("#years");
var supplyselected = false;
var padding = 28;
var paddingmultiplier = 50;
var lowopacity = 0.3;
var highopacity = 0.7;
var format2Number = d3.format(",.2f"),
    formatNumber = d3.format(",.0f"),
    format = function(a) {
        return formatNumber(a)
    },
    format2 = function(a) {
        return format2Number(a)
    },
    color = d3.scale.category20();
d3.select("#chart").style("width", document.getElementById("chart").offsetWidth - sizecorrection)
d3.select("#titlebar").style("width", document.getElementById("titlebar").offsetWidth - sizecorrection)
d3.select("#timeslider").style("width", document.getElementById("titlebar").offsetWidth)
var margin = {
        top: 70,
        right: 10,
        bottom: 12,
        left: 40
    },
    width = document.getElementById("chart").offsetWidth - margin.left - margin.right,
    height = document.getElementById("chart").offsetHeight - margin.bottom - 130;
var svg = d3.select("#chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height]);
var path = sankey.reversibleLink();
var calo = '--';
var a3 = "1";
var year = 0;
if (myyear)
{var prevyear=myyear}
else
{var prevyear = 2010;} //select initial year, optional, otherwise defaults to first entry in list
if (myindex)
{document.getElementById("b"+myindex).checked = true;}
else
{document.getElementById("b01").checked = true;} //select initial index, optional, otherwise defaults
var firstgo = true;
var svg2 = d3.select("#chart2").append("svg").attr("width", 160).attr("height", 70).append("g").attr("transform", "translate(20,10)");
var sankey2 = d3.sankey().nodeWidth(10).nodePadding(1).size([125, 50]);
var timedragdealer = new Dragdealer();
var change = function() {};
var change2 = function() {};
var scrollsankey = function(a) {};
document.addEventListener("keydown", function ( event ) {
    if (( event.keyCode >= 33 && event.keyCode <= 34 ) || (event.keyCode >= 37 && event.keyCode <= 40)) {
        switch( event.keyCode ) {
            case 33: // pg up
            case 37: // left
            case 38: // up
                if (d3.select("#content").style("opacity")==1) {scrollsankey(1)}; //scroll only if we are on the sankey page
                break;
            case 34: // pg down
            case 39: // right
            case 40: // down
                if (d3.select("#content").style("opacity")==1) {scrollsankey(-1)};
                break;
        }

        event.preventDefault();
    }
}, false);
var tiptext="no data";
var coordinates=[0,0];

// Define div for tooltips
var tooltipdiv = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .on("mouseover",function(){
        tooltipdiv.transition()
            .delay(300)
            .duration(200)
            .style("opacity", 1)
            .style("z-index", 10);})
    .on("mouseout",function(){
        tooltipdiv.transition()
            .delay(300)
            .duration(200)
            .style("opacity", 0)
            .style("z-index", -10);})
    .on("click",function(){
        tooltipdiv.transition()
            .duration(200)
            .style("opacity", 0)
            .style("z-index", -10);})
    .attr("onmousewheel","scrollsankey(event.wheelDelta)");
var old;
var tipshow=function(d){
    tooltipdiv.transition()
        .delay(300)
        .duration(200)
        .style("opacity", 1)
        .style("z-index", 10);

    if (!d || d!=old){
        tooltipdiv	.html('<table style="text-align:center;">'+tiptext+'</table>')
            .style("left", (d3.event.pageX+30) + "px")
            .style("top", (d3.event.pageY - 30) + "px");
    }

}
var tiphide=function(d){
    old=d;
    tooltipdiv.transition()
        .delay(300)
        .duration(200)
        .style("opacity", 0)
        .style("z-index", -10);

}

d3.json(datapath+"json/countries.json", function(d) {
    dropdown.selectAll("option").remove();
    for (var key in d.countries) {
        dropdown.append("option").text(d.countries[key]);
    };
    if (mycountry) {
        dropdown.node().value=mycountry;
    } else {
        dropdown.node().value="~ World"; //select initial country, optional, otherwise defaults to first entry in list
    }
    dropdown.on("change", sourcechange);
    var setyears = function() {

        d3.json(datapath+"json/"+dropdown.node().value+"m.json", function(d) {
            var missing=d.missing;
            var estimated=d.estimated;
            var ea = datapath+"json/EROEI1" + dropdown.node().value + ".json";
            d3.json(ea, function(d) {
                yearselect.selectAll("option").remove();
                for (var key in d) {
                    yearselect.append("option").text(key);
                };
                yearselect.node().value=Math.max(Math.min(prevyear,Math.max.apply(null,Object.keys(d))),Math.min.apply(null,Object.keys(d)));

                //<!--SANKEY DIAGRAM-->

                change = function() {

                    var a = datapath+"json/" + dropdown.node() //source JSON name
                            .value + yearselect.node().value;

                    //<!--DATA QUALITY INFO-->

                    d3.json(a + "i.json", function(d) {
                        var qualitytooltip="<table style='font-size:12px;'><tr><td style='border-bottom:solid;border-width:1px;'>Data availability for <b>"+yearselect.node().value+": </b>";
                        if ((d.length<1)&(missing.length<1)&(estimated.length<1)) {
                            d3.select("#quality").text("▪▪▪▪▪▪▪▪▪▪").style("color","#2a2");
                            qualitytooltip=qualitytooltip+"<b style='color:#2a2;'"+">Complete</b></td></tr><tr><td>All data is available in the database.</td></tr>";
                        }
                        else {
                            if ((d.length+estimated.length<5)&(missing.length<3)) {
                                d3.select("#quality").text("▪▪▪▪▪▪▪▪▫▫").style("color","#2a2");
                                qualitytooltip=qualitytooltip+"<b style='color:#2a2;'"+">High</b></td></tr>";
                            }
                            else if ((d.length+estimated.length<3)&(missing.length<5)) {
                                d3.select("#quality").text("▪▪▪▪▪▪▪▪▫▫").style("color","#2a2");
                                qualitytooltip=qualitytooltip+"<b style='color:#2a2;'"+">High</b></td></tr>";
                            }
                            else if ((d.length+estimated.length<11)&(missing.length<1)) {
                                d3.select("#quality").text("▪▪▪▪▪▪▫▫▫▫").style("color","#f60");
                                qualitytooltip=qualitytooltip+"<b style='color:#f60;'"+">Medium</b></td></tr>";
                            }
                            else if ((d.length+estimated.length<9)&(missing.length<3)) {
                                d3.select("#quality").text("▪▪▪▪▪▪▫▫▫▫").style("color","#f60");
                                qualitytooltip=qualitytooltip+"<b style='color:#f60;'"+">Medium</b></td></tr>";
                            }
                            else if ((d.length+estimated.length<7)&(missing.length<5)) {
                                d3.select("#quality").text("▪▪▪▪▪▪▫▫▫▫").style("color","#f60");
                                qualitytooltip=qualitytooltip+"<b style='color:#f60;'"+">Medium</b></td></tr>";
                            }
                            else if ((d.length+estimated.length<15)&(missing.length<7)) {
                                d3.select("#quality").text("▪▪▪▪▫▫▫▫▫▫").style("color","#D90000");
                                qualitytooltip=qualitytooltip+"<b style='color:#D90000;'"+">Fair</b></td></tr>";
                            }
                            else {
                                d3.select("#quality").text("▪▪▫▫▫▫▫▫▫▫").style("color","#D90000");
                                qualitytooltip=qualitytooltip+"<b style='color:#D90000;'"+">Low</b></td></tr>";
                            };
                            if (missing.length>0) qualitytooltip=qualitytooltip+"<tr><td><b>Missing data:</b></td></tr><tr><td>"+JSON.stringify(missing).replace(/\"/g,"").replace(/\,/g,"</td></tr><tr><td>").replace(/\[/g,"").replace(/\]/g,"")+"</td></tr>";
                            if (estimated.length>0) qualitytooltip=qualitytooltip+"<tr><td><b>Estimated data:</b></td></tr><tr><td>"+JSON.stringify(estimated).replace(/\"/g,"").replace(/\,/g,"</td></tr><tr><td>").replace(/\[/g,"").replace(/\]/g,"")+"</td></tr>";
                            if (d.length>0) qualitytooltip=qualitytooltip+"<tr><td><b>Interpolated data:</b></td></tr><tr><td>"+JSON.stringify(d).replace(/\"/g,"").replace(/\,/g,"</td></tr><tr><td>").replace(/\[/g,"").replace(/\]/g,"")+"</td></tr>";
                        }
                        qualitytooltip=qualitytooltip+"</table>";
                        d3.select("#qualitywrap")
                            .on("mouseover",function(){
                                tiptext=qualitytooltip;
                                tipshow();
                            })
                            .on("mouseout",tiphide);
                    });

                    var a2 = a + "k";
                    d3.select("#cid").text(dropdown.node().value)
                    d3.select("#yid").text(yearselect.node().value)
                    if (document.getElementById("b00").checked) a = a + "00";
                    if (document.getElementById("b10").checked) a = a + "10";
                    if (document.getElementById("b20").checked) a = a + "20";
                    if (document.getElementById("b30").checked) a = a + "30";
                    if (document.getElementById("b01").checked) a = a + "01";
                    if (document.getElementById("b11").checked) a = a + "11";
                    if (document.getElementById("b21").checked) a = a + "21";
                    if (document.getElementById("b31").checked) a = a + "31";
                    if (document.getElementById("b02").checked) a = a + "02";
                    if (document.getElementById("b12").checked) a = a + "12";
                    if (document.getElementById("b22").checked) a = a + "22";
                    if (document.getElementById("b32").checked) a = a + "32";
                    if (document.getElementById("b03").checked) a = a + "03";
                    if (document.getElementById("b13").checked) a = a + "13";
                    if (document.getElementById("b23").checked) a = a + "23";
                    if (document.getElementById("b33").checked) a = a + "33";
                    //push hash for easy sharing
                    myhash = "&"+a.slice(a.length-2,a.length)+"&"+yearselect.node().value+"&"+dropdown.node().value.stripSpaces();
                    if (!((window.location.hash=="#&map") || (window.location.hash=="#&description") || (window.location.hash=="#&scatter"))) {
                        window.location.hash=myhash;
                    }
                    a3 = a.slice(a.length-1,a.length);
                    a = a + ".json";
                    a2 = a2 + a3+ ".json";
                    if (a3=="3") {
                        d3.select("#ER").text("WROWI");
                        d3.select("#units").text("ktonnes");
                        supplyselected = true;
                    } else {
                        d3.select("#ER").text("EROEI");
                        d3.select("#units").text("TWh");
                        supplyselected = false;
                    }
                    if ((document.getElementById("b20").checked) || (document.getElementById("b21").checked) || (document.getElementById("b22").checked) || (document.getElementById("b23").checked)) {
                        paddingmultiplier = 5;
                    } else {
                        paddingmultiplier = 50;
                    }
                    padding = paddingmultiplier * (1 - densityslider.getValue()[0]) + 3

                    //<!--MAIN SANKEY-->

                    d3.json(a, function(d) {
                        svg.selectAll("g").remove();
                        sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height]);
                        sankey.nodes(d.nodes).links(d.links).layout(500);
                        var g = svg.append("g") //link
                            .selectAll(".link").data(d.links).enter().append("g").attr("class", "link").sort(function(j, i) {
                                return i.dy - j.dy
                            });
                        var h = g.append("path") //path0
                            .attr("d", path(0));
                        var f = g.append("path") //path1
                            .attr("d", path(1));
                        var e = g.append("path") //path2
                            .attr("d", path(2));

                        var mouseovr=function(a,d){
                            d3.select(a).style('opacity', highopacity);
                            if (supplyselected) {
                                if (d.value != 0) {
                                    calo = format2(d.prod / (d.value * 0.00116222222 / 100))
                                } else calo = '--'
                                tiptext = "<tr><td style='font-weight:bold;color:" +d.source.color+";'>"+d.source.name+"</td><td style='font-size:24px;'>→</td><td style='font-weight:bold;color:"+d.target.color+";'>"+d.target.name+ "</td></tr><tr><td>Weight</td><td>" + format(d.value) + "</td><td> ktonnes</td></tr><tr><td>Energy</td><td>" + format2(d.prod) + "</td><td> TWh</td></tr><tr><td>Caloric value</td><td>" + calo + "</td><td>kcal/100g</td></tr>"
                            } else {
                                if (d.prod != 0) {
                                    calo = format2(d.value / (d.prod * 0.00116222222 / 100))
                                } else calo = '--'
                                tiptext = "<tr><td style='font-weight:bold;color:" +d.source.color+";'>"+d.source.name+"</td><td style='font-size:24px;'>→</td><td style='font-weight:bold;color:"+d.target.color+";'>"+d.target.name+ "</td></tr><tr><td>Energy</td><td>" + format2(d.value) + "</td><td> TWh</td></tr><tr><td>Weight</td><td>" + format(d.prod) + "</td><td> ktonnes</td></tr><tr><td>Caloric value</td><td>" + calo + "</td><td>kcal/100g</td></tr>"
                            }
                            tipshow(d);
                            pietooltip = setTimeout(function() {
                                hide("#mypie2");
                                updatepie(eval(d.supply), "#mypie", d.source.name, d.target.name, d.value, true);
                            }, 500);
                        }
                        g.attr("fill", function(i) {
                            return i.source.color = color(i.source.name.replace(/ .*/, ""))
                        })
                            .attr("opacity", lowopacity)
                            .on("mouseover", function(d) {
                                mouseovr(this,d);
                            })
                            .on("click", function(d) {
                                mouseovr(this,d);
                            }).on("mouseout", function(d) {
                                d3.select(this).style('opacity', lowopacity);
                                window.clearTimeout(pietooltip);
                                tiphide(d);
                            })
                        var mouseovr2=function(d){
                            svg.selectAll(".link").filter(function(l) {
                                return l.source == d || l.target == d;
                            }).transition().style('opacity', highopacity);
                            var nodesource = new Array();
                            var nodetarget = new Array();
                            svg.selectAll(".link").filter(function(l) {
                                return l.target == d;
                            })[0].forEach(function(l) {
                                    nodesource.push(JSON.parse("{\"l\":\"" + l.__data__.source.name + "\", \"v\":" + l.__data__.value + "}"))
                                })
                            svg.selectAll(".link").filter(function(l) {
                                return l.source == d;
                            })[0].forEach(function(l) {
                                    nodetarget.push(JSON.parse("{\"l\":\"" + l.__data__.target.name + "\", \"v\":" + l.__data__.value + "}"))
                                })
                            if (nodesource.length == 0) {
                                nodesource = eval('[{\"l\":\"None\", \"v\":0}]')
                            }
                            if (nodetarget.length == 0) {
                                nodetarget = eval('[{\"l\":\"None\", \"v\":0}]')
                            }

                            if (supplyselected) {
                                tiptext = "<tr><td style='font-weight:bold;color:" +d.color+ ";'>"+ d.name + "</td></tr><tr><td>" + format(d.value) + " ktonnes</td></tr>";
                            } else {
                                tiptext = "<tr><td style='font-weight:bold;color:" +d.color+ ";'>" + d.name + "</td></tr><tr><td>" + format2(d.value) + " TWh</td></tr>";
                            }
                            tipshow();
                            pietooltip = setTimeout(function() {
                                show("#mypie2");
                                updatepie(nodesource, "#mypie2", "Incoming", d.name, d3.sum(nodesource, function(d) {
                                    return d.v;
                                }), false);
                                updatepie(nodetarget, "#mypie", d.name, "Outgoing", d3.sum(nodetarget, function(d) {
                                    return d.v;
                                }), false);


                            }, 500);
                        }
                        var c = svg.append("g") //node
                            .selectAll(".node").data(d.nodes).enter().append("g").attr("class", "node").attr("transform", function(i) {
                                return "translate(" + i.x + "," + i.y + ")"
                            }).call(d3.behavior.drag().origin(function(i) {
                                return i
                            }).on("dragstart", function() {
                                this.parentNode.appendChild(this)
                            }).on("drag", b));
                        c.append("rect") //node
                            .attr("height", function(i) {
                                return i.dy
                            }).attr("width", sankey.nodeWidth()).style("fill", function(i) {
                                return i.color = color(i.name.replace(/ .*/, ""))
                            }).style("stroke", function(i) {
                                return d3.rgb(i.color).darker(2)
                            }).on("mouseover", function(d) {
                                mouseovr2(d);
                            }).on("click", function(d) {
                                mouseovr2(d);
                            }).on("mouseout", function(d) {
                                svg.selectAll(".link").filter(function(l) {
                                    return l.source == d || l.target == d;
                                }).transition().style('opacity', lowopacity);
                                window.clearTimeout(pietooltip);
                                tiphide();
                            }).on("dblclick", function(d) {
                                svg.selectAll(".link").filter(function(l) {
                                    return l.target == d;
                                }).attr("display", function() {
                                    if (d3.select(this).attr("display") == "none") return "inline"
                                    else return "none"
                                });
                            })
                        c.append("text") //node
                            .attr("x", -6).attr("y", function(i) {
                                return i.dy / 2
                            }).attr("dy", ".35em").attr("text-anchor", "end").attr("transform", null).text(function(i) {
                                return i.name
                            }).filter(function(i) {
                                return i.x < width / 2
                            }).attr("x", 6 + sankey.nodeWidth()).attr("text-anchor", "start");
                        c.append("text") //node
                            .attr("x", function(i) {return -i.dy / 2})
                            .attr("y", function(i) {return i.dx / 2 + 6})
                            .attr("transform", "rotate(270)").attr("text-anchor", "middle").text(function(i) {
                                if (i.dy>50){
                                    return format(i.value)
                                }
                            }).attr("fill","white").attr("stroke","black");

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
                        }
                    })

                    //<!--EROEI MINI-SANKEY-->

                    d3.json(a2, function(d) {
                        //d3.select("#EROEI").text(parseFloat(d.links[1].value / d.links[0].value).toFixed(2)) //old version, deprecated, without imports. see new defined in the time graph section below
                        svg2.selectAll("g").remove();
                        sankey2 = d3.sankey().nodeWidth(13).nodePadding(5).size([125, 50]);
                        sankey2.nodes(d.nodes).links(d.links).layout(32);
                        var g2 = svg2.append("g") //link
                            .selectAll(".link").data(d.links).enter().append("g").attr("class", "link").sort(function(j, i) {
                                return i.dy - j.dy
                            });
                        var h2 = g2.append("path") //path0
                            .attr("d", path(0));
                        var f2 = g2.append("path") //path1
                            .attr("d", path(1));
                        var e2 = g2.append("path") //path2
                            .attr("d", path(2));
                        g2.attr("fill", function(i) {
                            return i.source.color = color(i.source.name.replace(/ .*/, ""))
                        }).attr("opacity", lowopacity);
                        var c2 = svg2.append("g") //node
                            .selectAll(".node").data(d.nodes).enter().append("g").attr("class", "node").attr("transform", function(i) {
                                return "translate(" + i.x + "," + i.y + ")"
                            })
                        c2.append("rect") //node
                            .attr("height", function(i) {
                                return i.dy
                            }).attr("width", sankey2.nodeWidth()).style("fill", function(i) {
                                return i.color = color(i.name.replace(/ .*/, ""))
                            }).style("stroke", function(i) {
                                return d3.rgb(i.color).darker(2)
                            }).on("mouseover", function(i){
                                if (supplyselected) {
                                    tiptext = "<tr><td style='font-weight:bold;color:" +i.color+ ";'>"+ i.name + "</td></tr><tr><td>" + format(i.value) + " ktonnes</td></tr>";
                                } else {
                                    tiptext = "<tr><td style='font-weight:bold;color:" +i.color+ ";'>" + i.name + "</td></tr><tr><td>" + format2(i.value) + " TWh</td></tr>";
                                }
                                tipshow();
                                return;	})
                            .on("mouseout", tiphide);
                        c2.append("text") //node
                            .attr("x", -3).attr("y", -6).attr("text-anchor", "end").attr("transform", "rotate(270)").text(function(i) {
                                if ((i.name == "Food") | (i.name == "Output") | (i.name == "Input")) return i.name
                            }).attr("text-anchor", "end");
                    })

                    //<!--EROEI TIME-GRAPH-->

                    d3.json(datapath+"json/EROEI" + a3 + dropdown.node().value + ".json", function(d) {
                        d3.select("#EROEI").text(parseFloat(d[d3.select("#yid").text()]).toFixed(2))
                        var sin = [];
                        var sin2 = [];
                        var sin3 = [];
                        var x = [];
                        var y = [];
                        for (var key in d) {
                            sin.push({
                                x: parseInt(key),
                                y: d[key]
                            });
                            x.push(parseInt(key));
                            y.push(d[key]);
                        };
                        var lr=linearRegression(y,x);
                        var lr2=linearRegression(y.slice(parseInt((sin.length)/2),(sin.length)),x.slice(parseInt((sin.length)/2),(sin.length)));
                        sin2.push({
                            x: sin[0].x,
                            y: sin[0].x*lr['slope']+lr['intercept']
                        });
                        sin2.push({
                            x: sin[sin.length-1].x,
                            y: sin[sin.length-1].x*lr['slope']+lr['intercept']
                        });
                        sin3.push({
                            x: sin[parseInt((sin.length-1)/2)].x,
                            y: sin[parseInt((sin.length-1)/2)].x*lr2['slope']+lr2['intercept']
                        });
                        sin3.push({
                            x: sin[sin.length-1].x,
                            y: sin[sin.length-1].x*lr2['slope']+lr2['intercept']
                        });
                        nv.addGraph(function() {
                            var chart = nv.models.lineChart()
                                .margin({
                                    left: 7
                                }) //Adjust chart margins to give the x-axis some breathing room.
                                .useInteractiveGuideline(true) //We want nice looking tooltips and a guideline!
                                .showLegend(false) //Show the legend, allowing users to turn on/off line series.
                                .showYAxis(false) //Show the y-axis
                                .showXAxis(false); //Show the x-axis
                            chart.yAxis //Chart y-axis settings
                                .axisLabel('EROEI')
                                .tickFormat(d3.format('.03f'));
                            d3.select('#chart3 svg') //Select the <svg> element you want to render the chart in.
                                .datum(function() {
                                    return [{
                                        values: sin, //values - represents the array of {x,y} data points
                                        key: 'EROEI', //key  - the name of the series.
                                        color: '#f60', //color - optional: choose your own line color.
                                    }, {
                                        values: sin2, //values - represents the array of {x,y} data points
                                        key: 'long', //key  - the name of the series.
                                        color: '#2a2', //color - optional: choose your own line color.
                                    }, {
                                        values: sin3, //values - represents the array of {x,y} data points
                                        key: 'short', //key  - the name of the series.
                                        color: '#006CD9', //color - optional: choose your own line color.
                                    }];
                                }())
                                .on("click",function(){
                                    yearselect.node().selectedIndex=publicPosition;
                                    yearchange();
                                })
                                .call(chart);
                        });
                        if (supplyselected) {
                            d3.select("#EROEI").style("font-size",30);
                        } else {
                            d3.select("#EROEI").transition().style("font-size",35);
                        }
                    });
                };

                yearselect.on("change", yearchange);

                function yearchange() {
                    year = yearselect.node().value - yearselect.node().options[0].value + 1;
                    d3.select("#timeslider").select(".value").text(parseInt(yearselect.node().value));
                    timedragdealer.setValue((year - 1) / (yearselect.node().length - 1), 0, false)
                }

                scrollsankey = function(a) { //scroll delta
                    if (a < 0) {
                        year = Math.min(yearselect.node().length, year + 1)
                    } else {
                        year = Math.max(1, year - 1)
                    }
                    timedragdealer.setValue((year - 1) / (yearselect.node().length - 1), 0, false)
                }

                //<!--TIME SCROLL-->

                if (firstgo) { //initialize timeslider on first iteration
                    timedragdealer = new Dragdealer("timeslider", {
                        x: 0,
                        steps: 100,//yearselect.node().length,
                        animationCallback: function(a, b) {
                            d3.select("#timeslider").select(".value").text(parseInt(yearselect.node().options[0].text) + Math.round(a * (parseInt(yearselect.node().options[document.getElementById("years").length - 1].text) - parseInt(yearselect.node().options[0].text))))
                        },
                        callback: function(a, b) {
                            year = Math.round(a * (yearselect.node().length - 1)) + 1;
                            yearselect.node().selectedIndex = year - 1;
                            change();
                        }

                    });
                    firstgo=false;
                }
                //reset step scale on other iterations
                var x=[];
                var i=0;
                while(x.push(i++/(yearselect.node().length-1))<yearselect.node().length);
                timedragdealer.stepRatios=x;

                yearchange(); //initialize & trigger change in main sankey

            });
        });
    };

    setyears();

    function sourcechange() {
        prevyear=yearselect.node().value;
        setyears();
    };
});
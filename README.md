jquery.svg.js
=============

A jquery plugin of svg.To deal the svg elements in jquery mode.

## How to use ##

#### $.svg(svgcode) ####

Build the svg elements with svg code or svg file.Make sure the svg code are legitimate.

       $.svg("<circle cx='10' cy='10' r=10></circle>").appendTo($("svg"));
       
       $.ajax({
          url:"xxx.svg",
          dataType:"text"
       }).done(function(code){
          $.svg(code).appendTo("body");
       });
       
#### $().svgElement(tagName) ####

Just create a svg element with the tag name you want.

       $().svgElement("circle").attr({cx:10,cy:10,r=10}).appendTo("svg");
       
#### $().element(tagName,namespace) ####

Create an element with a tag name and its namespace.

       $().element("circle","http://www.w3.org/2000/svg").attr({cx:10,cy:10,r=10}).appendTo("svg");
       
#### $("svg").svgToImage() ####

Transform a svg element to a img element,then use it as a img,For example you can download the svg as a image file by the canvas.

       $.svgToImage($("svg")).appendTo("body");

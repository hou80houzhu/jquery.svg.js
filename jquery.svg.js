(function($) {
    var node = function() {
        this.tag = "";
        this.props = {};
        this.hasProp = false;
        this.children = [];
        this.parent = null;
        this.cache = null;
    };
    node.prototype.element = function() {
        this.cache = $().element(this.tag, "http://www.w3.org/2000/svg").attr(this.props);
        if (this.parent && this.parent.cache) {
            this.parent.cache.append(this.cache);
        }
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].element();
        }
    };
    var textnode = function(content, parent) {
        this.content = content;
        this.parent = parent;
    };
    textnode.prototype.element = function() {
        var a = $();
        a.nodes = [window.document.createTextNode(this.content)];
        a.length = 1;
        this.cache = a;
        if (this.parent && this.parent.cache) {
            this.parent.cache.append(this.cache);
        }
    };
    var tagsTransformer = {
        isDoctype: /\<\!DOCTYPE[\s\S]*?\>/g,
        isNote: /\<\!\-\-[\s\S]*?\-\-\>/g,
        isXmlTag: /\<\?[\s\S]*?\?\>/g,
        filter: function(str) {
            str = str.trim();
            return str.replace(tagsTransformer.isNote, "").replace(tagsTransformer.isDoctype, "").replace(tagsTransformer.isXmlTag, "");
        },
        noLatin1: function(str) {
            var r = "";
            for (var i = 0; i < str.length; i++) {
                if (str[i].charCodeAt(0) <= 255) {
                    r += str[i];
                }
            }
            return r;
        },
        parse: function(str) {
            if (str && str !== "") {
                str = tagsTransformer.filter(str);
                var stacks = [], nodes = [], current = null;
                var tagname = "", tagendname = "", propname = "", value = "", text = "";
                var tagnamestart = false, propstart = false, valuestart = false, tagendstart = false, element = false, textis = false;
                for (var i = 0; i < str.length; i++) {
                    var a = str[i];
                    if (a !== "\r" && a !== "\n") {
                        if (a === "<") {
                            element = true;
                            if (text.trim() !== "") {
                                current = new textnode(text.trim(), stacks[stacks.length - 1]);
                                stacks[stacks.length - 1].children.push(current);
                                text = "";
                            }
                            if (str[i + 1] && str[i + 1] === "/") {
                                tagendstart = true;
                            } else {
                                current = new node();
                                stacks.push(current);
                                if (stacks.length - 2 >= 0) {
                                    stacks[stacks.length - 2].children.push(current);
                                    current.parent = stacks[stacks.length - 2];
                                }
                                tagnamestart = true;
                            }
                            continue;
                        } else if (a === " ") {
                            if (element) {
                                if (tagnamestart) {
                                    tagnamestart = false;
                                    current.tag = tagname.trim();
                                    tagname = "";
                                }
                                if (!propstart && !valuestart) {
                                    propstart = true;
                                    continue;
                                }
                            }
                        } else if (a === "=") {
                            element && (propstart = false);
                        } else if (a === "'" || a === "\"") {
                            if (!valuestart && element) {
                                valuestart = a;
                                continue;
                            } else {
                                if (valuestart === a) {
                                    valuestart = false, current.hasProp = true;
                                    current.props[propname.trim()] = value.trim();
                                    propname = "", value = "";
                                }
                            }
                        } else if (a === ">") {
                            element = false, propstart = false, valuestart = false, tagnamestart = false;
                            if (tagendstart) {
                                tagendstart = false, tagendname = "";
                                stacks.length === 1 && (nodes.push(stacks[0]));
                                stacks.pop();
                            }
                            if (!current.hasProp) {
                                current.tag === "" && (current.tag = tagname.trim());
                                tagname = "";
                            }
                            continue;
                        } else if (a === "/") {
                            if (str[i + 1] && str[i + 1] === ">") {
                                element = false, valuestart = false, propstart = false,
                                        tagendstart = false, tagnamestart = false, tagendname = "";
                                if (stacks.length === 1) {
                                    nodes.push(stacks[0]);
                                }
                                if (!current.hasProp) {
                                    current.tag === "" && (current.tag = tagname.trim());
                                    tagname = "";
                                }
                                stacks.pop();
                            }
                            continue;
                        }
                        tagnamestart && (tagname += a);
                        propstart && (propname += a);
                        valuestart && (value += a);
                        tagendstart && (tagendname += a);
                        !element && (text += a);
                    }
                }
                console.log(nodes);
                return nodes;
            } else {
                return [];
            }
        },
        convers: function(svg) {
            var nodes = tagsTransformer.parse(svg), b = window.document.createDocumentFragment();
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].element();
                b.appendChild(nodes[i].cache.get(0));
            }
            return $(b);
        }
    };

    $.svg = function(html) {
        var a = $().element("svg", "http://www.w3.org/2000/svg");
        if (typeof html === 'string') {
            if ($.browser.webkit || $.browser.safari || $.browser.opera) {
                var b = window.document.createDocumentFragment();
                a.html(html).children().each(function() {
                    b.appendChild(this);
                });
                return $(b);
            } else {
                return tagsTransformer.convers(html);
            }
        } else {
            return a;
        }
    };
    $.fn.svgElement = function(type) {
        if (typeof type === 'string') {
            type = "svg";
        }
        return $().element(type, "http://www.w3.org/2000/svg");
    };
    $.fn.element = function(tagName, ns) {
        var node = null;
        if (tagName) {
            if (ns) {
                node = [window.document.createElementNS(ns, tagName)];
            } else {
                node = [window.document.createElement(tagName)];
            }
        } else {
            node = [window.document.createDocumentFragment()];
        }
        return $(node);
    };
    $.svgToImage = function(dom) {
        if (dom instanceof jQuery && dom.length > 0 && dom.get(0).nodeName.toLowerCase() === "svg") {
            var str="";
            if ($.browser.msie||$.browser.mozilla) {
                str = $().element("div").append(dom.attr({
                    version: "1.1",
                    xmlns: "http://www.w3.org/2000/svg"
                }).clone()).html();
            } else {
                str = dom.attr({
                    version: "1.1",
                    xmlns: "http://www.w3.org/2000/svg"
                }).get(0).outerHTML;
            }
            return $().element("img").attr("src", 'data:image/svg+xml;base64,' + btoa(tagsTransformer.noLatin1(str)));
        } else {
            return null;
        }
    };
})(jQuery);

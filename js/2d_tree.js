/*global document:true*/

/* Code for the 2-dimensional tree visualizer */
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var WIDTH = canvas.getAttribute("width") 
var HEIGHT = canvas.getAttribute("height")

function center_x(x) {
    return WIDTH/2 + x
}

function center_y(y) {
    return HEIGHT/2 - y
}

/* 2 dimensional node class */
class Node {
    constructor(x,y,split_dim,left=null,right=null) {
        this._x = x
        this._y = y
        this._split_dim = split_dim
        this._left = left
        this._right = right
    }
    
    /* setters and getters */
    set left(left) { this._left = left }
    get left() { return this._left }
    set right(right) { this._right = right }
    get right() { return this._right }
    set split_dim(d) { this._split_dim = d }
    get split_dim() { return this._split_dim }
    get x() { return this._x }
    get y() { return this._y }
    
    insert(x,y) {
        var split_dim = this.split_dim
        var key = split_dim == "x" ? this.x : this.y
        var new_key = split_dim == "x" ? x : y
        
        if (new_key < key) {
            this.left = this.left == null ? new Node(x,y,split_dim=="x"?"y":"x") : this.left.insert(x,y)
        } else {
            this.right = this.right == null ? new Node(x,y,split_dim=="x"?"y":"x") : this.right.insert(x,y)
        }
        
        return this
    }
    
    draw(show_coordinates=false,left_bound=-WIDTH,right_bound=WIDTH, bottom_bound=-HEIGHT,top_bound=HEIGHT) {
        var size = 5
        var x = center_x(this.x)
        var y = center_y(this.y)
        var split_dim = this.split_dim
        
        /* draw the vertex point */
        ctx.fillRect(x - size/2, y - size/2,size,size)
        
        /* drawing algorithm */
        if (split_dim == "x") {
            ctx.beginPath()
            ctx.moveTo(x,center_y(bottom_bound))
            ctx.lineTo(x,center_y(top_bound))
            ctx.stroke()
        } else if (split_dim == "y") {
            ctx.beginPath()
            ctx.moveTo(center_x(left_bound),y)
            ctx.lineTo(center_x(right_bound),y)
            ctx.stroke()
        } else
            throw "Invalid split dimension"
    
        /* display the coordinates if specified */
        if (show_coordinates)
            ctx.fillText("("+this.x+","+this.y+")",x,y)
        
        /* recurse and draw left node*/
        if (this.left != null) {
            this.left.draw(
                show_coordinates,
                left_bound,
                split_dim == "x" ? this.x : right_bound,
                bottom_bound,
                split_dim == "y" ? this.y : top_bound,
                split_dim == "x" ? "y" : "x")
        }
        
        if (this.right != null) {
            this.right.draw(
                show_coordinates,
                split_dim == "x" ? this.x : left_bound,
                right_bound,
                split_dim == "y" ? this.y : bottom_bound,
                top_bound,
                split_dim == "x" ? "y" : "x")
        }
    }
}

/* Parsing Code */

/* Consumes the given token from the input string. 
Note that the token variable must be a string. All
escape characters must be escaped as well (ie. "\" -> 
"\\"). If the token does not match the start of the
string, an error message is thrown to caller. */
function match_tok(input,token) {
    var parse = input.match("^" + token + "(.*)")
    if (parse == null)
        throw "Exception: match_tok() failed. Token: \"" + 
            token + "\" Input: \"" + input + "\""
    else
        return parse[1]
}

/* Parses the coordinates of given input of the form: "(x,y)".
Returns an array of the parsed values (floats). A parsing
error is thrown if encountered. */
function parse_coordinate(input) {
    var prev, next, x, y
    prev = match_tok(input,"\\(") // match start bracket
    next = match_tok(prev,"[\\d-]+") // lookahead
    x = parseFloat(prev.match(/[\d\-]+/)) // parse first dim
    prev = match_tok(next,",") // match comma
    next = match_tok(prev,"[\\d-]+") // lookahead
    y = parseFloat(prev.match(/[\d\-]+/)) // parse the second dim
    prev = match_tok(next,"\\)") // match end bracket
    
    return [[x,y],prev]
}

/* Parses the given string representation of a Node */
function parse_node(input,split_dim="x") {
    /* null case for a parse*/
    if (input.match(/^null/) != null)
        return [null, match_tok(input,"null")]
    
    var parse_result, coordinates, left, right
    input = match_tok(input,"{") // match start bracket
    
    parse_result = parse_coordinate(input) // parse the coordinates
    coordinates = parse_result[0] // get corrdinates
    input = parse_result[1] // remaining string
    
    input = match_tok(input,",") // match comma
    
    /* parse the left node */
    parse_result = parse_node(input,split_dim == "x" ? "y" : "x")
    left = parse_result[0]
    input = parse_result[1]
    
    input = match_tok(input,",") // match comma

    /* parse the right node */
    parse_result = parse_node(input,split_dim == "x" ? "y" : "x")
    right = parse_result[0]
    input = parse_result[1]
    
    input = match_tok(input,"}") // match end bracket
        
    return [new Node(coordinates[0],coordinates[1],split_dim,left,right), input]
}


/* HTML Event Code */
var root

function insert_node_button() {
    var x = parseInt(document.getElementById("x_val").value)
    var y = parseInt(document.getElementById("y_val").value)
    
    root = root == null ? new Node(x,y,"x") : root.insert(x,y)
    
    root.draw(true)
}

function parse_treecode_button() {
    var input = document.getElementById("treecode").value.replace(/\s+/g,'')
    clear_tree()
    document.getElementById("message").innerHTML = ""
    
    try {
        root = parse_node(input,"x")[0]
    } catch(err) {
        document.getElementById("message").innerHTML = err
    }
    
    root.draw(true)
}

function clear_tree() {
    root = null
    ctx.clearRect(0,0,WIDTH,HEIGHT)
}

function clear_textbox() {
    clear_tree()
    document.getElementById("treecode").value = ""
}

/* At startup */
parse_treecode_button()


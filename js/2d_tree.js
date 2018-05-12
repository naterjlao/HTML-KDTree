/*global document:true*/

/* Code for the 2-dimensional tree visualizer */
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

/* 2 dimensional node class */
class Node {
    constructor(x,y,left,right) {
        this._x = x
        this._y = y
        this._left = left
        this._right = right
    }
    
    set left(left) { this._left = left }
    set right(right) { this._right = right }
    get left() { return this._left }
    get right() { return this._right }
    get x() { return this._x }
    get y() { return this._y }
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
    next = match_tok(prev,"[\\d.]+") // lookahead
    x = parseFloat(prev.match(/[\d\.]+/)) // parse first dim
    prev = match_tok(next,",") // match comma
    next = match_tok(prev,"[\\d.]+") // lookahead
    y = parseFloat(prev.match(/[\d\.]+/)) // parse the second dim
    prev = match_tok(next,"\\)") // match end bracket
    
    return [[x,y],prev]
}

/* Parses the given string representation of a Node */
function parse_node(input) {
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
    parse_result = parse_node(input)
    left = parse_result[0]
    input = parse_result[1]
    
    input = match_tok(input,",") // match comma

    /* parse the right node */
    parse_result = parse_node(input)
    right = parse_result[0]
    input = parse_result[1]
    
    input = match_tok(input,"}") // match end bracket
        
    return [new Node(coordinates[0],coordinates[1],left,right), input]
}

/* TESTING CODE */
var parse
var input1 = "{(3.4,6),null,null}"
var input2 = "{(6,3),{(6.34,5),null,null},null}"
var input3 = "{(8.54,2.123),{(43.6,3.14),null,null},{(6.78,9.32),null,null}}"
var input4 = "{(1.2,3.7),null,{(x3,y3,z1),null,null}}"

console.log(parse_node(input3))
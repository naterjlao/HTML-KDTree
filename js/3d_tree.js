/* Implementation of the 3D Tree */

/************ TREE METHODS *******************/
const NUM_DIM = 3

class Node {
    constructor(coordinates,split_dim,left=null,right=null) {
        this._coor = coordinates
        this._split_dim = split_dim % NUM_DIM
        this._left = left
        this._right = right
    }
    
    /* Setters and Getters */
    get coordinates() { return this._coor }
    get dim() { return this._split_dim }
    get left() { return this._left }
    set left(left) { this._left = left }
    get right() { return this._right }
    set right(right) { this._right = right }
    
    format() {
        var x = this.coordinates[0]
        var y = this.coordinates[1]
        var z = this.coordinates[2]
        return "("+x+","+y+","+z+") dim: " + this.dim + 
            " left: {" + (this.left == null ? "" : this.left.format()) +
            "} right: {" + (this.right == null ? "" : this.right.format()) + "}"
    }
    
    /* inserts a new node coordinate in the tree form: [x,y,z] */
    insert(coordinates) {
        var key = this.coordinates[this.dim]
        var new_key = coordinates[this.dim]
        var next_dim = (this.dim + 1) % NUM_DIM
        
        if (new_key < key) {
            this.left = this.left == null ? 
                new Node(coordinates,next_dim) :
                this.left.insert(coordinates)
        } else {
            this.right = this.right == null ?
                new Node(coordinates,next_dim) :
                this.right.insert(coordinates)
        }
        
        return this
    }

    /* low bound and up bound are interpreted as
    such: [x,y,z] */
    draw(camera,ctx,low_bound=[-250,-250,-250],up_bound=[250,250,250],show_coordinates=true) {
        var start, end
        
        /* find the line limits */
        start = this.coordinates.slice()
        start[this.dim] = low_bound[this.dim]
        end = this.coordinates.slice()
        end[this.dim] = up_bound[this.dim]
        
        /* find left upper bound and right lower bound */
        var left_bound = up_bound.slice()
        left_bound[this.dim] = this.coordinates[this.dim]
        var right_bound = low_bound.slice()
        right_bound[this.dim] = this.coordinates[this.dim]
        
        draw3dPoint(this.coordinates,camera,ctx)
        draw3dLine(start,end,camera,ctx)
        if (show_coordinates) draw3dCoordinates(this.coordinates,camera,ctx)
        
        var next_dim = (this.dim + 1) % NUM_DIM
        
        if (this.left != null) {
            this.left.draw(camera,ctx,low_bound,left_bound,show_coordinates)
            /* draw the branch line */
            let b_start = this.left.coordinates.slice()
            let b_end = this.coordinates.slice()
            b_start[next_dim] = this.coordinates[next_dim]
            b_end[this.dim] = this.left.coordinates[this.dim]
            
            draw3dLine(b_start,b_end,camera,ctx)
        }
        
        if (this.right != null) {
            this.right.draw(camera,ctx,right_bound,up_bound,show_coordinates)
            /* draw the branch line */
            let b_start = this.right.coordinates.slice()
            let b_end = this.coordinates.slice()
            b_start[next_dim] = this.coordinates[next_dim]
            b_end[this.dim] = this.right.coordinates[this.dim]
            
            draw3dLine(b_start,b_end,camera,ctx)
        }
    }
}

/************ PARSING METHODS ****************/
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
    var next, x, y
    input = input.replace(/\s+/g)
    
    input = match_tok(input,"\\(") // match start bracket
    next = match_tok(input,"[\\d-]+") // lookahead
    x = parseFloat(input.match(/[\d\-]+/)) // parse x dim
    input = match_tok(next,",") // match comma
    next = match_tok(input,"[\\d-]+") // lookahead
    y = parseFloat(input.match(/[\d\-]+/)) // parse x dim
    input = match_tok(next,",") // match comma
    next = match_tok(input,"[\\d-]+") // lookahead
    z = parseFloat(input.match(/[\d\-]+/)) // parse the y dim
    input = match_tok(next,"\\)") // match end bracket
    
    return [[x,y,z],input]
}

/* Parses the given string representation of a Node */
function parse_node(input,split_dim=0) {
    input = input.replace(/\s+/g)
    /* null case for a parse*/
    if (input.match(/^null/) != null)
        return [null, match_tok(input,"null")]
    
    var parse_result, coordinates, left, right
    var next_dim = (split_dim + 1) % NUM_DIM
    
    input = match_tok(input,"{") // match start bracket
    
    parse_result = parse_coordinate(input) // parse the coordinates
    coordinates = parse_result[0] // get corrdinates
    input = parse_result[1] // remaining string
    
    input = match_tok(input,",") // match comma
    
    /* parse the left node */
    parse_result = parse_node(input,next_dim)
    left = parse_result[0]
    input = parse_result[1]
    
    input = match_tok(input,",") // match comma

    /* parse the right node */
    parse_result = parse_node(input,next_dim)
    right = parse_result[0]
    input = parse_result[1]
    
    input = match_tok(input,"}") // match end bracket
        
    /*return [new Node(coordinates[0],coordinates[1],split_dim,left,right), input]*/
    
   return [new Node(coordinates,split_dim,left,right),input]
}

/************ RENDERING METHODS **************/
var context = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
const WIDTH = canvas.getAttribute("width")
const HEIGHT = canvas.getAttribute("height")

/* This defines the 3d bounds of a line 3d space:
[x_min,y_min,z_min,x_max,y_max,z_max]*/
var bounds = [-250,-250,-250,250,250,250]

function radian(deg) {
    return (deg % 360) * 2 * math.PI / 360
}

class Camera {
    constructor(rot=0,tilt=20) {
        this._rot = rot
        this._tilt = tilt
    }
    
    get rot() { return this._rot }
    set rot(r) { this._rot = r }
    
    matrix() {
        var rotation = radian(this._rot)
        var tilt = radian(this._tilt)
        
        var x_vec = [math.cos(rotation),math.sin(rotation),0]
        var y_vec = [-math.sin(rotation)*math.sin(tilt),
                     math.cos(rotation)*math.sin(tilt),math.cos(tilt)]
        
        return math.matrix([x_vec,y_vec])
    }
}

function shift_x(x) {
    return WIDTH/2 + x
}

function shift_y(y) {
    return HEIGHT/2 - y
}

/* start and end are 1d array vector */
function draw3dLine(start,end,camera,ctx) {
    var transform = camera.matrix()
    start = math.multiply(transform,math.transpose(math.matrix([start])))
    end = math.multiply(transform,math.transpose(math.matrix([end])))
    
    ctx.beginPath()
    ctx.moveTo(shift_x(start.get([0,0])),shift_y(start.get([1,0])))
    ctx.lineTo(shift_x(end.get([0,0])),shift_y(end.get([1,0])))
    ctx.stroke()
}

/* coordinates is a 1d array vector */
function draw3dPoint(coordinates,camera,ctx) {
    var size = 5
    coordinates = math.transpose(math.matrix([coordinates]))
    point = math.multiply(camera.matrix(),coordinates)
    x = shift_x(point.get([0,0])) - size/2
    y = shift_y(point.get([1,0])) - size/2
    
    ctx.fillRect(x,y,size,size)
}

/* coordinates is a 1d array vector */
function draw3dCoordinates(coordinates,camera,ctx) {
    var x_disp = 5
    var y_disp = 5
    coordinates = math.transpose(math.matrix([coordinates]))
    point = math.multiply(camera.matrix(),coordinates)
    x = shift_x(point.get([0,0]) + x_disp)
    y = shift_y(point.get([1,0]) + y_disp)
    
    ctx.fillText(
        "("+coordinates.get([0,0])+","+coordinates.get([1,0])+","+coordinates.get([2,0])+")",x,y)
}

function clear() {
    ctx.clearRect(0,0,WIDTH,HEIGHT)
}

/************ HTML CODE **********************/
var root
var camera = new Camera()

function insert_node_button() {
    var x = parseInt(document.getElementById("x_val").value)
    var y = parseInt(document.getElementById("y_val").value)
    var z = parseInt(document.getElementById("z_val").value)
    
    root = root == null ? new Node([x,y,z],0) : root.insert([x,y,z])
}

function parse_treecode_button() {
    var input = document.getElementById("treecode").value.replace(/\s+/g,'')
    clear_tree()
    document.getElementById("message").innerHTML = ""
    
    try {
        root = parse_node(input)[0]
    } catch (err) {
        document.getElementById("message").innerHTML = err
    }
}

function clear_tree() {
    root = null
    ctx.clearRect(0,0,WIDTH,HEIGHT)
}

function clear_textbox() {
    clear_tree()
    document.getElementById("treecode").value = ""
}

setInterval(function() {
    clear()
    if (root != null) root.draw(camera,ctx)
    camera.rot = camera.rot + 0.5
},20)

parse_treecode_button()

/************ TESTING AREA *******************/

m = math.matrix([[1,2],[3,4]])
console.log(m.format())
console.log(parse_coordinate("(1,2,3)"))
console.log(parse_node("{(1,2,3),{(4,5,6),null,null},{(7,8,9),null,null}}"))
console.log(8 % 4)

n = new Node([0,0,0],0,new Node([50,50,50],1),new Node([-50,-50,-50],1))
console.log(n.format())

l = new Node([1,2,3],0)
l = l.insert([5,5,5]).insert([7,7,7]).insert([10,10,10])
console.log(l)

//ctx.fillRect(0,0,50,50)

console.log(radian(359))

var c = new Camera(0,20)
var p1 = [50,50,50]
var p2 = [50,-50,-50]
var p3 = [100,100,50]

/*
setInterval(function() {
    clear()
    draw3dPoint(p1,c,ctx)
    draw3dPoint(p2,c,ctx)
    draw3dPoint(p3,c,ctx)
    draw3dLine(p1,p2,c,ctx)
    draw3dCoordinates(p1,c,ctx)
    c.rot = c.rot + 1
}, 25)
*/

n.insert([-20,-20,-20])
n.insert([-20,-20,-30])









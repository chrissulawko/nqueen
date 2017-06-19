var GLOBAL_LOOP_ID; 			//Used for clear interval
var GLOBAL_MOVE_COUNTER = 0;	//Count how many moves it's taken
								//Should probably be moved into Game but i'm lazy rn

var Game = function() {
	GLOBAL_MOVE_COUNTER = 0; //reset
	var that = {};
	that.canvas = document.getElementById("canvas");
	that.ctx = canvas.getContext("2d");

	//canvas dimensions
	that.H = that.canvas.clientHeight; 
	that.W = that.canvas.clientWidth;
	that.numQueens = document.getElementById("numQueensInput").value || 20;
	that.queens = [];
	that.vCellSize = that.H/that.numQueens;
	that.hCellSize = that.W/that.numQueens;
	that.conflictQueens = {}; //keep track of the queens being attacked
	that.noProgressCounter = 0; //Keep track of the number of turns where no improvement is made
	that.NO_CHANGE_LIMIT = 4;
	for (var i = 0; i < that.numQueens; i++) {
		var spec = {};
		spec.x = i; 
		spec.y = Math.floor(Math.random()*that.numQueens);
		that.queens.push(queen(that, spec));
	}
	// ******************* Drawing the board
	that.draw = function() {
		var ctx = that.ctx;
		ctx.globalCompositeOperation = "source-over";
		//Draw checker board
		for (var row = 0; row < that.numQueens; row ++){
			for (var column = 0; column < that.numQueens; column ++)	{
				// coordinates of the top-left corner
				var x = column * that.hCellSize;
				var y = row * that.vCellSize;
				if (row%2 == 0)	{
					if (column%2 == 0)	ctx.fillStyle = "lightgray";
					else ctx.fillStyle = "white";
				}else {
					if (column%2 == 0)	ctx.fillStyle = "white";
					else ctx.fillStyle = "lightgray";
				}
				ctx.fillRect(x, y, that.hCellSize, that.vCellSize);
			}
		}
		
		// ******************** finding lines of attacks
		//for every queen, see if that queen is in line and draw a red line to it
		that.drawAttackLines();
		//draw the queens
		that.drawQueens();
	};
	that.drawAttackLines = function() {
		that.conflictQueens = [];
		for (var i = 0; i < that.queens.length; i++) {
			for (var j = i+1; j < that.queens.length; j++) {
				if (that.isAttacking(that.queens[i], that.queens[j])) {
					that.conflictQueens.push(that.queens[i]);
					that.conflictQueens.push(that.queens[j]);
					//that.conflictQueens[that.queens[i]] = that.queens[i];
					//that.conflictQueens[that.queens[j]] = that.queens[j];
					that.drawLineBtwQueens(that.queens[i], that.queens[j]);
				}
			}
		}
	};
	that.drawQueens = function() {
		for (var i = 0; i < that.queens.length; i++) {
			that.queens[i].draw();
		}
	};
	//Given two queens, see if they are attacking each other
	that.isAttacking = function(queen1, queen2) {
		var pos1x = queen1.x; pos1y = queen1.y;
		var pos2x = queen2.x; pos2y = queen2.y;
		//horizontal check
		if (pos1x == pos2x) return true;	
		//vert check
		if (pos1y == pos2y) return true;
		// '\' diagonal check
		if (pos1x + pos1y == pos2x + pos2y) return true
		// '/' diagonal check
		if (pos1y - pos1x == pos2y - pos2x) return true
		return false;
	};
	
	that.drawLineBtwQueens = function(queen1, queen2) {
		var pos1 = queen1.get_canvas_position();
		var pos2 = queen2.get_canvas_position();
		
		that.ctx.beginPath();
		that.ctx.moveTo(pos1.x, pos1.y);
		that.ctx.lineTo(pos2.x, pos2.y);
		that.ctx.lineWidth = queen1.radius / 2;
		that.ctx.strokeStyle = 'rgba(255,0,0,0.44)';
		that.ctx.stroke();
		that.ctx.closePath();
	}
	//return the 'h-score' of the board, which is the total amount of 'attacks'
	//the queens have on each other
	that.findHScore = function() {
		var hScore = 0;
		for (var i = 0; i < that.queens.length; i++) {
			for (var j = i+1; j < that.queens.length; j++) {
				if (that.isAttacking(that.queens[i], that.queens[j])) {
					hScore++;
				}
			}
		}
		return hScore    
	};
	
	//Select and move a random queen to a location that minimizes the h-score
	that.findBetterSpot = function(loopId) {
		if (that.conflictQueens.length === 0) {
			if (loopId) 
				clearInterval(loopId);
			return;
		}
		var q = that.conflictQueens[Math.floor(that.conflictQueens.length * Math.random())];
		var xPos = q.x;
		var minScore = that.findHScore();

		var bestInd = q.y;
		var origY = q.y;
		for (var i = 0; i < that.numQueens; i++) {
			q.moveTo(xPos, i);
			var newScore = that.findHScore();
			//console.log("newscore: " + newScore);
			if (newScore < minScore) {
				minScore = newScore;
				bestInd = i;
				//break;
			}
		}
		//console.log("moving to " + xPos + ", "+bestInd);
		if (bestInd === origY) {
			that.noProgressCounter++;
		} else {
			that.noProgessCounter = 0;
		}
		//It's not clear to me why I can't compare the values directly from the 
		//that object. When doing so, the conditional always evaluates to false
		var counter = that.noProgressCounter;
		var max = that.NO_CHANGE_LIMIT;
		if (counter >= max) {
			q.moveTo(xPos, Math.floor(that.numQueens * Math.random()));
			that.noProgressCounter = 0;
		} else {
			q.moveTo(xPos, bestInd);
		}
	};
	return that;
}

var queen = function(game, spec) {
	if ((queen.arguments.length == 1) || (typeof spec != 'object'))
		spec = {};
	var that = {};
	that.radius = spec.radius || Math.min(game.hCellSize, game.vCellSize) * .35;
	that.x = spec.x;
	that.y = spec.y;
	that.get_position = {
			x : that.x,
			y : that.y
		};
	
	//returns the position of the center of the queen as it should be placed on the canvas
	that.get_canvas_position = function() {
		return {
			//Below is to test if we can unhide the position
			x : spec.canvasX = that.x * game.hCellSize + .5 * game.hCellSize,
			y : spec.canvasY = that.y * game.vCellSize + .5 * game.vCellSize 
			//x : spec.canvasX = spec.x * game.hCellSize + .5 * game.hCellSize,
			//y : spec.canvasY = spec.y * game.vCellSize + .5 * game.vCellSize 
		};
	};
	that.moveTo = function(newX, newY) {
		that.x = newX;
		that.y = newY;
	}
	
	that.draw = function() {
		game.ctx.beginPath();
		var radius = that.radius;
		var canvasPos = that.get_canvas_position();
		game.ctx.arc(canvasPos.x, canvasPos.y, radius, 0, 2 * Math.PI, false);
		game.ctx.fillStyle = 'black';
		game.ctx.strokeStyle = 'black';
		game.ctx.fill();
		game.ctx.stroke();
		game.ctx.closePath();
	};
	
	that.toString = function() {
		return "" + spec.x + ","+spec.y;
	}
	return that;
}

//Start the game
var gamerRunner = function() {
	init();
}

var init = function() {
	clearInterval(GLOBAL_LOOP_ID);
	var game = new Game();
		game.draw();
	GLOBAL_LOOP_ID = setInterval(function() {
		game.draw();
		game.findBetterSpot(GLOBAL_LOOP_ID);
		GLOBAL_MOVE_COUNTER ++;
		updateCount();
	}, 33);
	return game;
};

var updateCount = function() {
	var span = document.getElementById('numMoves');

	while( span.firstChild ) {
		span.removeChild( span.firstChild );
	}
	span.appendChild( document.createTextNode(GLOBAL_MOVE_COUNTER) );
}

//Return a random key from an object
function ranKey(obj) {
	var result;
	var count = 0;
	for (var prop in obj)
		if (Math.random() < 1/++count)
		   result = prop;
	return result;
}
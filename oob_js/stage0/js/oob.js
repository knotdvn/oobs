/**
 * @author dvn E. ptchr
 */

//------------
//Utility Functions
//------------

//allocate an array of size  and default value of essence
//note index 10 returns array[0-9]
function prep(size,essence){
	var construct = new Array(size);
	for(iter = 0; iter < size; iter++){
		construct[iter] = essence;
	}//end for array
	console.log(construct);
	return construct;
}//end prep allocation

/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
function chaos(entropy) {
    return Math.floor( Math.random() * (entropy) ) + 1;
}

//------------
//Utility Functions END
//------------

//------------
//Globals
//------------

//the pandemonium of souls
var pandemonium = 0;//This is really just the index/id#

//------------
//Globals END
//------------




function oob (){
	//give the oob a soul
	this.soul = pandemonium;
	//create a new ready and waiting soul
	pandemonium++;
	
	//lets give the oob some personal details
	this.name = '';
	this.age = 0;
	this.face ="(0_o)";
	//oobs live in a violent world
	this.attack = '';
	this.defend = '';
	
	this.act = function(){
		console.log('I act.');
	};//end this.act
	
	//oobs bodies are html divs
	this.body = function(){
		var skeleton = 
		'<div class="oob"' +
		'soul="' + this.soul +
		'" name="' + this.name + 
		'" age="' + this.age +
		'" attack"' + this.attack +
		'" defend"' + this.defend +
		'">' +
		'<p>' +
		this.face +
		'</p>' +
		'</div>';
		
		return skeleton;
	};//end create body	
}//end oob class



ark = prep(100,new oob);




jQuery(document).ready(function($){

	alert('oob Ready');
	$(ark).each(function(){
	$('#world').append(this.body());	
	});
	
});//end document ready


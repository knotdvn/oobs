/**
 * @author dvn E. ptchr
 */

//------------
//Utility Functions
//------------

//allocate an ARRAY of size  and default value of essence
//note index 10 returns array[0-9]
function prep(size, essence){
	var construct = new Array(size);
	for(iter = 0; iter < size; iter++){
		construct[iter] = essence;
	}//end for array
	console.log(construct);
	return construct;
}//end prep allocation

//returns an array of size num
//filled with unique new oobs
function seed_oobs(num){
	var posse = new Array(num);
	for(iter = 0; iter < num; iter++){
		posse[iter] = new oob();
	}//end for array
	return posse;
}//end function seed_oobs



/**
 * Returns a random INTEGER between 1 and entropy value
 * Using Math.round() will give you a non-uniform distribution!
 */
function chaos(entropy) {
    return Math.floor( Math.random() * (entropy) ) + 1;
}//end function chaos


/**
 * generate random name
 * this returns a random "first" name STRING for an oob
 * This helps make oobs individuals
 * 
 * This an attempt to use chaos and heuristics to produce
 * a name-sounding-thing.
 * */
function nomen(){
	var vowels = "aeiouy";
	var consonants = "bcdfghjklmnprstvwxyz";
	var first = "ABCDEFGHIJKLMNOPRSTUVWXYZ";
	var special_endings = new Array();
	special_endings[0] = "ck";
	special_endings[1] = "rs";
	special_endings[2] = "rz";
	special_endings[3] = "lm";
	special_endings[4] = "lk";
	special_endings[5] = "lp";
	special_endings[6] = "rt";
	special_endings[7] = "ff";
	special_endings[8] = "tz";
	special_endings[9] = "wz";
	special_endings[10] = "sh"; 
	special_endings[11] = "qu";
	
	var poke = first.charAt( chaos(24) );
	var nameN = 2 + chaos(5);
	
	
	//we have our first letter!
	var name = poke;
	for(i = 1; i < nameN; i++){
		//if true get a consonant next else get a vowel
		if (vowels.search(poke.toLowerCase()) != -1){
			poke = consonants.charAt( chaos(19) );
			if( i == ( nameN - 1) && ( chaos(100) <= 50 ) ){
				//this is also the last letter
				//and a 50% chance of a special ending
				poke = special_endings[chaos(12)-1];
			}//end if special ending
		}else{
			poke = vowels.charAt( chaos(5) );
		}//end if vowel else consonant
		
		name += poke;
	}//end for length of name
	
	return name;
	
}//end function nomen





//------------
//Utility Functions END
//------------

//------------
//Globals
//------------

//the pandemonium of souls
var pandemonium = 0;//This is really just the index/id#
//pandemonium - 1 = the last index 

//an array for all of the oobs 
var ark = null; 

//------------
//Globals END
//------------




function oob (){
	//give the oob a soul
	this.soul = pandemonium;
	//create a new ready and waiting soul
	pandemonium++;
	
	//lets give the oob some personal details
	this.name = nomen();
	this.age = 0;
	this.face ="(0_o)";
	//oobs live in a violent world
	this.attack = chaos(10);
	this.defend = chaos(10);
	
	//oobs need vitality
	this.health = chaos(10);
	
	//food restores vitality
	this.foodsack = chaos(30);
	//
	this.act = function(){
		console.log('I act.');
	};//end this.act
	
	this.eat = function(){
		var supply = this.foodsack;
		if(supply > 2){
			supply = supply - 2;
			this.health =+ 1;//food restores vitality
			$('#log').append('<p>' + this.name + ' is happy! :-)</p>');
		}else{
			$('#log').append('<p>' + this.name + ' is hungry. :-(</p>');
		}//end else hungry
	}//end function eat
	
	//oobs bodies are html divs
	this.body = function(){
		var skeleton = 
		'<div class="oob"' +
		'soul="' + this.soul +
		'" name="' + this.name + 
		'" age="' + this.age +
		'" attack="' + this.attack +
		'" defend="' + this.defend +
		'">' +
			'<p>' +
				this.face +
			'</p>' +
			
			'<div class="id-card">' +
				'<h1>' +  this.name +'</h1>' +
				'<h2>Health: ' + this.health + '</h2>' +
			'</div>' +
		'</div>';
		
		return skeleton;
	};//end create body	
}//end oob class

function conflict(aggressor, defender){
	var strike = aggressor.attack + chaos(4);
	var block = defender.defend + chaos(4);
	
	resolved = strike - block;
	if(resolved > 0){
	//agressor wins	
		defender.health--;
		defender.health--;
		$('#log').append('<p>' + aggressor.name + aggressor.health + ' struck ' + defender.name + defender.health + '!</p>');
	}else{
		aggressor.health --;
		$('#log').append('<p>' + defender.name + defender.health + ' blocked ' + aggressor.name  + aggressor.health + '!</p>');
	}//end else defender wins
	
	//this world is skewed, attackers do more damage when successful
	//and lose less health when unsuccessful
}//end function conflict/fight


//given a list of oobs and an oob to be excluded from search
//returns an oob who is found
function find( seeker, list ){
	var found = null;
	var entrope;//random oob
	var expire = 100;
	var goal = false;
	while (!goal && expire-- !== 0){
		entrope = (chaos(pandemonium) - 1);
		found = list[entrope];
		if(found !== seeker){
			goal = true;
		}//end if found an oob
	}//end while not goal
	if(expire !== 0){
		return found;
	}else{
		return null;
	}//end if not expired, else not found
	
}//end function find


//lets test the oob find method
function test_find_conflict(){
	
	
	ark = seed_oobs(10);
	$(ark).each(function(){
		
		$('#world').append(this.body());	
		//this.eat();
		//test the find each oob finds 3 oobs, could be the same oob 
		//but chaos decides
		console.log( this.name + " found " +  find( this , ark).name );
		console.log( this.name + " found " +  find( this , ark).name );
		console.log( this.name + " found " +  find( this , ark).name );
	
	//now we'll test the conflict function
	
	 conflict(  this,  find(  this,  ark ) );
	 	
	
	});//end for each oob
}//end test find conflict

//lets craft a little oob system shall we?

function oob_system(){
	
test_find_conflict();
}//end function oob_system

jQuery(document).ready(function($){

	alert('oob Ready');
	oob_system();
	
	
	
	
});//end document ready

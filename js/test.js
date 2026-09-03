/**
 * @author dvn
 */



//what good is chaos if you can't test it?
function test_chaos(){
	var distribution = "";
	var stats = prep(11,0);
	//gather data
	for(var i = 0; i <= 1000; i++){
		var moment = chaos(10);
		stats[moment]++;
		//this lets us make clean blocks
		if (moment == 10){
			 distribution += " |" + moment + "| ";
		}else{//end if 10
			 distribution += " | " + moment + "| ";
		}//end if 1-9
	}//end for	
	
	//data collected -ANALYZE
	var average = 0;
	tabulation = "";
	for(var j = 1; j <= 10; j++ ){
		tabulation += " j:" + j + " Occurrence = " + stats[j] + ' ';
		average += stats[j];
	}//end for stats
	average = average / 10;
	
	console.log("Average: " + average);
	console.log("Tabulation: " + tabulation);
	console.log("Distribution:");
	console.log(distribution);
	
}//end testchaos









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
	var consonants = "bcdfghjklmnpqrstvwxyz";
	var first = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
	
	var poke = first.charAt( chaos(25) );
	var test = "poke1: " + poke;
	var nameN = 4 + chaos(5);
	test += " nameN: " + nameN;
	//this is the programmers version of millers magic number 
	// 	7 ( + or - ) 2 = [5,6,7,8,9] = 4 + [1,2,3,4,5]
	
	//we have our first letter!
	var name = poke;
	for(i = 0; i < nameN; i++){
		test += " i:" + i;
		//if true get a consonant next else get a vowel
			test += " test: " + vowels.search(poke.toLowerCase());

		if (vowels.search(poke.toLowerCase()) != -1){
			console.log('vowel');
			poke = consonants.charAt( chaos(20) );
			if( i == ( nameN - 1) && ( chaos(100) <= 50 ) ){
				//this is also the last letter
				//and a 50% chance of a special ending
				poke += special_endings[chaos(11)-1];
			}//end if special ending
		}else{
			console.log('cons');
			poke = vowels.charAt( chaos(5) );
		}//end if vowel else consonant
		
		name += poke;
	}//end for length of name
	
	console.log(test);
	return name;
	
}//end function nomen


//lets make sure we get some good name-sounding-things
function test_nomen(){
	for(j = 0; j < 1; j++){
		console.log( 'Name: ' + nomen() );
	}//end for 100
}//end function test_nomen


//this function determines if a letter is a member or not
//coincidentally y is considered a vowel here.
function is_memberP(letter , vowels){
	if(vowels.search( letter ) != -1){
		return true;
	}else{
		return false;
	}//end else if
}//end is vowelP

var miller = 4 + chaos(5);
	//this is the programmers version of george millers magic number 
	// 	7 ( + or - ) 2 = [5,6,7,8,9] = 4 + [1,2,3,4,5]
	
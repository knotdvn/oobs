/**
 * @author Verb Blurber
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

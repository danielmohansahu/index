/////////////// CRITICAL VARIABLES ///////////////
var width = window.innerWidth*0.8,
	height = window.innerHeight*0.8;

var margin = {"top":50, "bottom":50, "left":75, "right":75},
	padding = 20,
	menu_width = width*2/3;
	menu_padding_x = 25,
	menu_padding_y = 15,
	menu_height = menu_padding_y*6;

// D3 Transition
var t = d3.transition()
    .duration(750);

// Initial Display:
var SELECTED_STATE = 'GA',
	SELECTED_X = 'SAT Score',
	SELECTED_Y = 'Student Debt ($)';

var data_dict = {
	'ACT Score (25th %)':'ACTCM25',
	'ACT Score (75th %)':'ACTCM75',
	'Student Debt ($)':'GRAD_DEBT_MDN_SUPP',
	'Public Price ($)':'NPT4_PUB',
	'Private Price ($)':'NPT4_PRIV',
	'Federal Loan (%)':'PCTFLOAN',
	'Pell Grant (%)':'PCTPELL',
	'Main Degree Awarded':'PREDDEG',
	'SAT Score':'SAT_AVG',
	'Student Population over 25 (%)':'UG25abv',
	'Undergraduate Enrollment':'UGDS',
	'10 Year Median Salary ($)':'md_earn_wne_p10',
}
var state_dict = {
	'AK':'Alaska','AL':'Alabama','AR':'Arkansas','AS':'American Samoa',
	'AZ':'Arizona','CA':'California','CO':'Colorado','CT':'Connecticut','DC':'District of Columbia',
	'DE':'Delaware','FL':'Florida','FM':'Federated States of Micronesia',
	'GA':'Georgia','GU':'Guam','HI':'Hawaii','IA':'Iowa',
	'ID':'Idaho','IL':'Illinois','IN':'Indiana','KS':'Kansas',
	'KY':'Kentucky','LA':'Louisiana','MA':'Massachusetts','MD':'Maryland',
	'ME':'Maine','MH':'Marshall Islands','MI':'Michigan','MN':'Minnesota',
	'MO':'Missouri','MP':'Northern Mariana Islands','MS':'Mississippi','MT':'Montana',
	'NC':'North Carolina','ND':'North Dakota','NE':'Nebraska',
	'NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NV':'Nevada',
	'NY':'New York','OH':'Ohio','OK':'Oklahoma','OR':'Oregon',
	'PA':'Pennsylvania','PR':'Puerto Rico','PW':'Palau','RI':'Rhode Island',
	'SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas',
	'UT':'Utah','VA':'Virginia','VI':'Virgin Islands','VT':'Vermont',
	'WA':'Washington','WI':'Wisconsin','WV':'West Virginia','WY':'Wyoming'
}
var state_dict_reverse = {};
for (key in state_dict) {state_dict_reverse[state_dict[key]] = key;}

/////////////// ELEMENTS ///////////////
var menu = d3.select("body").append("div")

var svg = d3.select("body")
	.append("svg")
	.attr("width",width + margin.left + margin.bottom)
	.attr("height",height + menu_height + margin.top + margin.bottom)
	.attr("transform","translate(" + margin.left + "," + (menu_height + margin.top) + ")")

var dropDownSTATE = menu.append("div")
	.style("position","relative")
	.style("top","" + menu_padding_y + "px")
	.style("left","" + menu_padding_x*5 + "px")
	.append("select")
	.style("position","absolute")
    .attr("name", "state-list")
   	.attr('class','form-control')
    .on('change',onchangeSTATE)
menu.append("div")
	.style("position","absolute")
	.style("top","" + (menu_padding_y+11) + "px")
	.style("left","" + menu_padding_x*3 + "px")
	.append("text")
	.text("State:")

var dropDownX = menu.append("div")
	.style("position","relative")
	.style("top","" + menu_padding_y*3 + "px")
	.style("left","" + menu_padding_x*5 + "px")
	.append("select")
	.style("position","absolute")
    .attr("name", "xaxis-list")
   	.attr('class','form-control')
    .on('change',onchangeX)
menu.append("div")
	.style("position","absolute")
	.style("top","" + (3*menu_padding_y+11) + "px")
	.style("left","" + menu_padding_x*3 + "px")
	.append("text")
	.text("X Axis:")

var dropDownY = menu.append("div")
	.style("position","relative")
	.style("top","" + menu_padding_y*5 + "px")
	.style("left","" + menu_padding_x*5 + "px")
	.append("select")
	.style("position","absolute")
    .attr("name", "yaxis-list")
   	.attr('class','form-control')
    .on('change',onchangeY)
menu.append("div")
	.style("position","absolute")
	.style("top","" + (5*menu_padding_y+11) + "px")
	.style("left","" + menu_padding_x*3 + "px")
	.append("text")
	.text("Y Axis:")

/////////////// INITIALIZE ///////////////
data_loop('initialize');

/////////////// CRITICAL FUNCTIONS ///////////////

// Data Loop:
function data_loop(input,selectValue,initialize) {
	d3.csv("Most+Recent+Cohorts+(Scorecard+Elements).csv",function(error, data) { 
		if (error) throw error;

		var states = get_unique_vals(data,"STABBR"),
			select_width = (menu_width - menu_padding_x*5);

		// Filter by States Data:
		dropDownSTATE.selectAll('option')
			.data(states).enter()
			.append('option')
			.text(function(d) { return state_dict[d]; });
		dropDownSTATE
			.style("width", "" + select_width + "px")
			.style("height", "25px")

		// Append X options
		dropDownX.selectAll('option')
			.data(d3.keys(data_dict)).enter()
			.append('option')
			.text(function(d) { return d; });
		dropDownX
			.style("width", "" + select_width + "px")
			.style("height", "25px")

		// Append Y options
		dropDownY.selectAll('option')
			.data(d3.keys(data_dict)).enter()
			.append('option')
			.text(function(d) { return d; });
		dropDownY
			.style("width", "" + select_width + "px")
			.style("height", "25px")
 

		if (input === 'initialize') {
			make_scatter(data,SELECTED_X,SELECTED_Y,SELECTED_STATE);}
		else if (input === 'STATE') {
			make_scatter(data,SELECTED_X,SELECTED_Y,selectValue);}
		else if (input === 'X') {
			make_scatter(data,selectValue,SELECTED_Y,SELECTED_STATE);}
		else if (input === 'Y') {
			make_scatter(data,SELECTED_X,selectValue,SELECTED_STATE);}
	})
};

function make_scatter(data,x_param,y_param,state) {
	// Clear old plot:
	if (typeof plot !== 'undefined' && plot) {
		plot.selectAll("circle")
			.transition()
			.duration(750)
			.attr("r",0)
		plot.selectAll("g").remove(); }

	// Filter by state and filter our NULL data
	data = data.filter(function(d) {return d['STABBR']===state;});
	data = data.filter(function(d) {return d[data_dict[x_param]] !== 'NULL';})
	data = data.filter(function(d) {return d[data_dict[x_param]] !== 'PrivacySuppressed';})
	data = data.filter(function(d) {return d[data_dict[y_param]] !== 'NULL';})
	data = data.filter(function(d) {return d[data_dict[y_param]] !== 'PrivacySuppressed';})

	// Scales:
	var x = d3.scale.linear().domain(get_domain(data,data_dict[x_param],0.1)).rangeRound([padding,width-padding]),
		y = d3.scale.linear().domain(get_domain(data,data_dict[y_param],0.1)).rangeRound([height-padding-menu_height,padding]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4).innerTickSize(-height+menu_height+padding*2),
		yAxis = d3.svg.axis().scale(y).orient("left").ticks(4).innerTickSize(-width + padding*2);

	// Recreate Plot:
	plot = svg.append("g")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform","translate(" + margin.left + "," + (margin.top + menu_height) + ")")
		
	plot.append("g")
		.attr("class","title")
		.attr("transform","translate(" + 25 + ",0)")
		.append("text")
		.text(y_param + " vs. " + x_param + ' for ' + state_dict[state])

	plot.selectAll("circle")
		.data(data).enter()
		.append("circle")
		.attr("cx",function(d) {return x(+d[data_dict[x_param]])})
		.attr("cy",function(d) {return y(+d[data_dict[y_param]])})
		.attr("r",0)
		.attr("stroke","ghostwhite")
		.append("title")
		.text(function(d) {return (d.INSTNM + "\n" + d.UGDS + " enrolled") ; })

	plot.selectAll("circle")
		.transition()
		.delay(0)
		.duration(750)
		.attr("r",function(d) {return 2*(Math.log(+d['UGDS']))^2;})
		.style("fill",function(d) {
		if(d['NPT4_PRIV']==='NULL') {return 'lightskyblue'}
		else if (d['NPT4_PUB']==='NULL') {return 'tomato'} })

	// Add Axes:
	plot.append("g")
		.attr("class","axis")
		.attr("transform", "translate(0," + (height-padding-menu_height) + ")")
		.call(xAxis)
		.append("text")
		.attr("x",width*2/3)
		.attr("y",35)
		.attr("text-anchor","middle")
		.text(x_param)
	plot.append("g")
		.attr("class","axis")
		.attr("transform", "translate(" + padding + ",0)")
		.call(yAxis)
		.append("text")
		.attr("transform","rotate(270)")
		.attr("y",-50)
		.attr("x",(-height+menu_height)*1/3)
		.text(y_param)

	// Add Legend:
	var legend = plot.append("g")
		.attr("class","legend")
		.attr("transform","translate(" + (width-padding) + "," + padding + ")")

	legend.append("rect")
		.attr("x",-padding*3)
		.attr("y",0)
		.attr("width",padding*4)
		.attr("height",padding*3)
		.style("fill","ghostwhite")
		.style("stroke","black")

	legend.append("circle")
		.attr("r",8)
		.attr("cx",-padding*2)
		.attr("cy",padding*2/3)
		.style("fill","tomato")
	legend.append("text")
		.attr("x",-padding)
		.attr("y",padding*2/3+3)
		.style("font-size","12px")
		.text("Private")
	legend.append("circle")
		.attr("r",8)
		.attr("cx",-padding*2)
		.attr("cy",padding*2)
		.style("fill","lightskyblue")
	legend.append("text")
		.attr("x",-padding)
		.attr("y",padding*2+3)
		.style("font-size","12px")
		.text("Public")

}

/////////////// HELPER FUNCTIONS ///////////////

function onchangeSTATE() {
	SELECTED_STATE = state_dict_reverse[d3.select(this).property('value')];
	data_loop('STATE',SELECTED_STATE);};

function onchangeX() {
	SELECTED_X = d3.select(this).property('value');
	data_loop('X',SELECTED_X);}

function onchangeY() {
	SELECTED_Y = d3.select(this).property('value');
	data_loop('Y',SELECTED_Y); }

function get_unique_vals(DATA,field) {
	var vals = [];
	DATA.forEach(function(d) {
		vals.push(d[field]);})
	return uniquify(vals).sort(); }

function uniquify(array) {
	return array.filter(function(d,i,self) {
		return self.lastIndexOf(d)===i}); }

function get_domain(data,parameter,pad) {
	var max = -Infinity,
		min = Infinity;
	data.forEach(function(d) {
		max = d3.max([+d[parameter],max]);
		min = d3.min([+d[parameter],min]);})
	return [min*(1-pad), max*(1+pad)]; }
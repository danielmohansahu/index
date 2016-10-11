/////////////// CRITICAL VARIABLES ///////////////
var margin = {"top":50, "bottom":100, "left":100, "right":100},
	width = 500,
	height = 400,
	menu_height = 50,
	padding = 10,
	menu_padding = 50;

var SELECTED_STATE = 'GA',
	SELECTED_X = 'SAT Score (average)',
	SELECTED_Y = 'Student Debt';

var data_dict = {
	'ACT Score (25th percentile)':'ACTCM25',
	'ACT Score (25th percentile)':'ACTCM75',
	'Student Debt':'GRAD_DEBT_MDN_SUPP',
	'Public University Price':'NPT4_PUB',
	'Public University Price':'NPT4_PRIV',
	'Federal Loan Percentage':'PCTFLOAN',
	'Pell Grant Percentage':'PCTPELL',
	'Main Degree Awarded':'PREDDEG',
	'SAT Score (average)':'SAT_AVG',
	'Student Population over 25 (percent)':'UG25abv',
	'Undergraduate Enrollment':'UGDS',
	'Median Salary after 10 Years':'md_earn_wne_p10'
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
	.style("position","relative")
	.style("top","" + menu_padding + "px")
	.style("left","" + menu_padding + "px")

var div1 = menu.append("div").append("text")
	.attr("x",menu_padding)
	.attr("y",menu_padding)
	.text("States:")
var dropDownSTATE = menu.append("select")
    .attr("name", "state-list")
   	.attr('class','select')
    .on('change',onchangeSTATE)

var div2 = menu.append("div").append("text")
	.attr("x",menu_padding)
	.attr("y",menu_padding)
	.text("X AXIS:")
var dropDownX = menu.append("select")
    .attr("name", "xaxis-list")
   	.attr('class','select')
    .on('change',onchangeX)

var div3 = menu.append("div").append("text")
	.attr("x",menu_padding)
	.attr("y",menu_padding)
	.text("Y AXIS:")
var dropDownY = menu.append("select")
    .attr("name", "yaxis-list")
   	.attr('class','select')
    .on('change',onchangeY)

var svg = d3.select("body")
	.append("svg")
	.attr("width",width + margin.left + margin.bottom)
	.attr("height",height + menu_height + margin.top + margin.bottom)
	.attr("transform","translate(0," + (menu_height + margin.top) + ")")

/////////////// INITIALIZE ///////////////
data_loop('initialize');

/////////////// CRITICAL FUNCTIONS ///////////////

function onchangeSTATE() {
	SELECTED_STATE = state_dict_reverse[d3.select(this).property('value')];
	data_loop('STATE',SELECTED_STATE);};

function onchangeX() {
	SELECTED_X = d3.select(this).property('value');
	data_loop('X',SELECTED_X);};

function onchangeY() {
	SELECTED_Y = d3.select(this).property('value');
	data_loop('Y',SELECTED_Y);};


// Data Loop:
function data_loop(input,selectValue,initialize) {
	d3.csv("Most+Recent+Cohorts+(Scorecard+Elements).csv",function(error, data) { 
		if (error) throw error;

		// Filter by States Data:
		states = get_unique_vals(data,"STABBR")
		var optionsSTATE = dropDownSTATE.selectAll('option')
			.data(states).enter()
			.append('option')
			.text(function(d) { return state_dict[d]; });
		dropDownSTATE.style("width","300px")
			.style("height","25px")

		// Append X options
		Xopts = d3.keys(data_dict);
		var optionsX = dropDownX.selectAll('option')
			.data(Xopts).enter()
			.append('option')
			.text(function(d) { return d; });
		dropDownX.style("width","300px")
			.style("height","25px")

		// Append Y options
		Yopts = d3.keys(data_dict);
		var optionsY = dropDownY.selectAll('option')
			.data(Yopts).enter()
			.append('option')
			.text(function(d) { return d; });
		dropDownY.style("width","300px")
			.style("height","25px")
 

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

function recursive_filter(DATA,filt_field,value,return_field) {
	return get_unique_vals(
		DATA.filter(function(d) {
			return d[filt_field]==value; }),
		return_field )}

function get_unique_vals(DATA,field) {
	var vals = [];
	DATA.forEach(function(d) {
		vals.push(d[field]);})
	return uniquify(vals).sort();
}

function uniquify(array) {
	return array.filter(function(d,i,self) {
		return self.lastIndexOf(d)===i});
}

function get_domain(data,parameter,pad) {
	var max = -Infinity,
		min = Infinity;
	data.forEach(function(d) {
		max = d3.max([+d[parameter],max]);
		min = d3.min([+d[parameter],min]);})
	return [min*(1-pad), max*(1+pad)];}

function make_scatter(data,x_param,y_param,state) {
	if (typeof plot !== 'undefined' && plot) {
		plot.remove();}

	// Filter by state and filter our NULL data
	data = data.filter(function(d) {return d['STABBR']===state;})
	data = data.filter(function(d) {return d[data_dict[x_param]] !== 'NULL';})
	data = data.filter(function(d) {return d[data_dict[x_param]] !== 'PrivacySuppressed';})
	data = data.filter(function(d) {return d[data_dict[y_param]] !== 'NULL';})
	data = data.filter(function(d) {return d[data_dict[y_param]] !== 'PrivacySuppressed';})

	// Scales:
	var x = d3.scale.linear().domain(get_domain(data,data_dict[x_param],0.1)).rangeRound([padding,width-padding]),
		y = d3.scale.linear().domain(get_domain(data,data_dict[y_param],0.1)).rangeRound([height-padding-menu_height,padding]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(6).innerTickSize(-height+menu_height+padding*2),
		yAxis = d3.svg.axis().scale(y).orient("left").ticks(6).innerTickSize(-width+padding*2);

	// Recreate Plot:
	plot = svg.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + menu_height + margin.top + margin.bottom)
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
		.attr("r",function(d) {return 2*(Math.log(+d['UGDS']))^2;})
		.attr("cx",function(d) {return x(+d[data_dict[x_param]])})
		.attr("cy",function(d) {return y(+d[data_dict[y_param]])})
		.style("fill",function(d) {
			if(d['NPT4_PRIV']==='NULL') {return 'lightskyblue'}
			else if (d['NPT4_PUB']==='NULL') {return 'tomato'} })
		.append("title")
		.text(function(d) {return (d.INSTNM + "\n" + d.UGDS + " enrolled") ; })

	// Add Axes:
	plot.append("g")
			.attr("class","axis")
			.attr("transform", "translate(0," + (height-padding-menu_height) + ")")
			.call(xAxis)
		.append("text")
			.attr("x",width/2)
			.attr("y",padding*5)
			.text(x_param)
	plot.append("g")
			.attr("class","axis")
			.attr("transform", "translate(" + padding + ",0)")
			.call(yAxis)
		.append("text")
			.attr("transform","rotate(270)")
			.attr("y",-padding*6)
			.attr("x",-(height)/2)
			.text(y_param)

	// Add Legend:
	var legend = plot.append("g")
		.attr("class","legend")
		.attr("transform","translate(" + 2*width/3 + "," + -menu_height*1.75 + ")")

	legend.append("circle")
		.attr("r",5)
		.style("fill","tomato")
	legend.append("text")
		.attr("x",25)
		.attr("y",3)
		.style("font-size","12px")
		.text("Private University")
	legend.append("circle")
		.attr("r",5)
		.attr("cy",20)
		.style("fill","lightskyblue")
	legend.append("text")
		.attr("x",25)
		.attr("y",23)
		.style("font-size","12px")
		.text("Public University")

}


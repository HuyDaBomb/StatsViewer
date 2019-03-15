var APPNAME = "Statistics";
var sessionId = null;
var csrfToken = null;
var userId = "hphan";
var password = "1212";
// var server = "https://i3remote.avantpoint.com:8019/icws/";
var server = "http://connect.networkinteract.com:8018/icws/";
//sendRequest is a wrapper around the XMLHttpRequest to make ajax calls a little easier.		
function sendRequest(verb, url, data, callback, errorCallback){
	var xmlhttp=new XMLHttpRequest();
	
	if(callback)
	{
		xmlhttp.onreadystatechange=function()
									  {
									  if (xmlhttp.readyState==4 && (xmlhttp.status>=200 && xmlhttp.status<300))
									    {
									    	callback(JSON.parse(xmlhttp.responseText));
									    }
									    else if (xmlhttp.readyState==4 && (xmlhttp.status>=300 ))
									    {
									    	console.log(xmlhttp);
									    }
									  };
	}
	console.log (url);
	xmlhttp.open(verb,server + url ,true);
	xmlhttp.setRequestHeader("Accept-Language","en-us");
	xmlhttp.withCredentials = true;
	
	if(csrfToken){
		xmlhttp.setRequestHeader("ININ-ICWS-CSRF-Token",csrfToken);
	}
	
	if(errorCallback){
		xmlhttp.onerror = errorCallback;
	}
	else{
		xmlhttp.onerror = function(){
			console.log(xmlhttp);
		};
	}
	
	if(data){
		xmlhttp.send(JSON.stringify(data));
	}
	else
	{
		xmlhttp.send();
	}
	
}

function onLoad(){
	login();
}

function login(){
	loginData = {
			    "__type":"urn:inin.com:connection:icAuthConnectionRequestSettings",
			    "applicationName":APPNAME,
			    "userID":userId,
			    "password":password                      
		};
	
	sendRequest("POST","connection", loginData, afterLogin);				
}


		
function getStatLabel(id){
	var statisticLabel = document.getElementById(id);
	return statisticLabel;
}

function afterLogin(data){
	
	sessionId = data.sessionId;
	//sessionId = data['sessionId']; //grabs the sessionId from the data object
	csrfToken= data['csrfToken']; //grabs the csrfToken from the data object
	console.log(data);
	startIcws();
}

function startIcws(){
	//start a polling method to get messages from the server
	messagePollIntervalId = setInterval(function(){sendRequest("GET",sessionId + "/messaging/messages", null, messagePollProcesser);}, 1000);
	
	//get the available workgroups, this if for the workgroup selection box
	sendRequest("POST", sessionId + "/statistics/statistic-parameter-values/queries", {"parameterTypeId":"ININ.People.WorkgroupStats:Workgroup"}, workgroupParameterCallback);
	
	//get the queue intervals
	sendRequest("POST", sessionId + "/statistics/statistic-parameter-values/queries", {"parameterTypeId":"ININ.Queue:Interval"}, intervalCallback);
	
	//get the alert catalog
	sendRequest("PUT", sessionId + "/messaging/subscriptions/alerts/alert-catalog", {"alertSetCategories": [2,3,4,5]}, null);
	
	//start watching the last workgroup
	if(localStorage['workgroup'] && localStorage['interval']){
		startWorkgroupStatWatches(localStorage['workgroup'], localStorage['interval']);
	}
}

//callback for getting the available workgroups, update the select box with the values
function workgroupParameterCallback(data){
	var values = data.parameterValues;
	updateSelect(values, "workgroupSelect");
	
	if(localStorage['workgroup']){
		document.getElementById('workgroupSelect').value = localStorage['workgroup'];
	}
}

//callback for getting the workgroups intervals, update the select box with the values
function intervalCallback(data){
	var values = data.parameterValues;
	updateSelect(values, "intervalSelect");
	if(localStorage['interval']){
		document.getElementById('intervalSelect').value = localStorage['interval'];
	}
}

//helper method to add options to a select dropdown
function updateSelect(values, elementId){
	for(var i=0; i < values.length; i++){
		var x=document.getElementById(elementId);
		var option=document.createElement("option");
		option.text= values[i].displayString;
		option.value = values[i].value;
		x.add(option);
	}
}

function selectChanged(){
	stopStatWatches();
	var workgroup = document.getElementById('workgroupSelect').value;
	var interval = document.getElementById('intervalSelect').value;
	localStorage['workgroup'] = workgroup;
	localStorage['interval'] = interval;
	startWorkgroupStatWatches(workgroup, interval);
	
	alertWorkgroupChanged(workgroup);
}

//This method queries the server for new messages
function messagePollProcesser(messages){
			
	if(!messages || messages.length == 0){
		return;
	}
	console.log(messages);
	
	for(var i=0; i<messages.length; i++)
	{
		var message = messages[i];
		if(message.__type == "urn:inin.com:statistics:statisticValueMessage"){
			handleStatUpdate(message.statisticValueChanges);
		}
		else if(message.__type == "urn:inin.com:alerts:alertCatalogChangedMessage"){
			handleAlertCatalogChange(message);
		}
		else if(message.__type == "urn:inin.com:alerts:alertNotificationMessage"){
			processAlert(message);
		}
	}
}
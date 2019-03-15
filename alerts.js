var alertDefinitions = {};
var workgroupAlerts = {};
var lastAlertWorkgroup = null;

//when the selected workgroup changes, we need to deregister our old alert listener, and register a new one
function alertWorkgroupChanged(workgroup){
	if(workgroup != lastAlertWorkgroup){
		cleanupAlerts();
		for(alert in workgroupAlerts){
			var alertObject = workgroupAlerts[alert];
			executeAlert(alertObject);
		}
		lastAlertWorkgroup = workgroup;
	}	
}

function cleanupAlerts(){
	var statisticLabels = document.getElementsByTagName("label");
	for(var i=0; i<statisticLabels.length; i++){
		var label = statisticLabels[i];
		if(label.dataset['alertId'] != ''){
			label.style.background = "";
			label.style.color = "";
			label.dataset['alertId'] = '';
		}
	}
}

function processAlert(message){

	for(var x=0; x< message.alertNotificationList.length; x++){
		var alert = message.alertNotificationList[x];
		executeAlert(alert);
	}
}

function executeAlert(alert){
	var alertDefinition = alertDefinitions[alert.alertDefinitionId]; 
	if(alertDefinition != null ){
		if(isAlertForCurrentWorkgroup(alertDefinition)){
			if(alert.cleared == false){ 
				processFontAlertAction(alertDefinition, alert.alertRuleId);
			}
			else if(alertDefinition != null && alert.cleared){
				var statId = alertDefinition.statisticKey.statisticIdentifier;
				var label =getStatLabel(statId);
				if(label.dataset['alertId'] == alert.alertRuleId){
					label.style.background = "";
					label.style.color = "";
					label.dataset['alertId'] = '';
				}
			}
		}
		
		saveAlertWorkgroup(alert);
	}
}

//used to persist the alert so that when we change workgroups we will have those alerts.  
function saveAlertWorkgroup(alert)
{
	if(alert.cleared && workgroupAlerts[alert.alertRuleId]){
		//remove from map
		delete workgroupAlerts[alert.alertRuleId];
	}
	else if(!alert.cleared){
		workgroupAlerts[alert.alertRuleId] = alert;
	}
	
}

//take a font action from the message and apply it to the font label
function processFontAlertAction(alertDefinition, ruleId){
	var statId = alertDefinition.statisticKey.statisticIdentifier;
	for(var x=0; x<alertDefinition.alertRules.length; x++){
		var rule = alertDefinition.alertRules[x];
		if(rule.alertRuleId != ruleId){
			continue;
		}
		
		for(var y=0; y< rule.alertActions.length; y++){
			var action = rule.alertActions[y];
			
			if(action.targetId == "ININ.Supervisor.FontAlertAction"){
				var label =getStatLabel(statId);
				var background = action.namedValues['ININ.Supervisor.FontAlertAction.BackgroundColor'].split(':');
				label.style.background = "rgb(" + background[1] +"," + background[2]+"," + background[3] + ")";
				var foreground = action.namedValues['ININ.Supervisor.FontAlertAction.TextColor'].split(':');
				label.style.color = "rgb(" + foreground[1] +"," + foreground[2]+"," + foreground[3] + ")";
				label.dataset['alertId'] = ruleId;
			}
		}
	
	}
}

//we only want to process an alert if it is for the currently selected workgroup
function isAlertForCurrentWorkgroup(alert){
	var currentWorkgroup = document.getElementById('workgroupSelect').value;
	var paramValues = alert.statisticKey.parameterValueItems;
	for(var x=0; x< paramValues.length; x++){
		var param = paramValues[x];
		if(param.parameterTypeId == "ININ.People.WorkgroupStats:Workgroup" && param.value != currentWorkgroup){
			return false;
		}
	}
	
	return true;
}

function handleAlertCatalogChange(message){
	
	message.alertSetsAdded = message.alertSetsAdded || [];
	message.alertSetsChanged = message.alertSetsChanged || [];
	
	var alertSets = message.alertSetsAdded.concat(message.alertSetsChanged);
	
	for(var x=0; x<alertSets.length; x++)
	{
		for(var y=0; y<alertSets[x].alertDefinitions.length; y++){
			var definition = alertSets[x].alertDefinitions[y];
		
			if(hasVisualAlert(definition))
			{
				alertDefinitions[definition.alertDefinitionId] = definition;
			}
		}
	}	
}

//checks to see if there is a FontAlertAction
function hasVisualAlert(alertDefinition){
	if(!alertDefinition || !alertDefinition.alertRules){
		return false;
	}
	for(var x=0; x<alertDefinition.alertRules.length; x++){
		for(var y=0; y<alertDefinition.alertRules[x].alertActions.length; y++){
			if(alertDefinition.alertRules[x].alertActions[y].targetId == "ININ.Supervisor.FontAlertAction")
				return true;
		}
	}
	return false;
}
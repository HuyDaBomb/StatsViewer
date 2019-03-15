var workgroupStatIds = ['inin.workgroup:AgentsLoggedInAndActivated',
								'inin.workgroup:LongestAvailable',
								'inin.workgroup:NotAvailable',
								'inin.workgroup:NumberAvailableForACDInteractions',
								'inin.workgroup:InteractionsConnected',
								'inin.workgroup:PercentAvailable'];
						
var interactionStatIds =['inin.workgroup:AverageHoldTime',
						'inin.workgroup:AverageTalkTime',
						'inin.workgroup:AverageWaitTime',
						'inin.workgroup:InteractionsAbandoned',
						'inin.workgroup:InteractionsAnswered',
						'inin.workgroup:InteractionsCompleted',
						];

function handleStatUpdate(statChangeList){
	for(var x = 0; x < statChangeList.length; x++){
		var stat = statChangeList[x];
		var value = "N/A";
		
		if(stat.statisticValue){
			value = stat.statisticValue.value;
		}
		var statLabel = getStatLabel(stat.statisticKey.statisticIdentifier);
		if(statLabel){
			statLabel.innerHTML = value;
		}
	}
}

function startWorkgroupStatWatches(workgroupId, interval){
	var statData = [];
	
	for(var x = 0 ; x< workgroupStatIds.length; x++){
		var statId =workgroupStatIds[x];
		var statKey = 	{
						  "statisticIdentifier":statId,
						  "parameterValueItems":
						  [
						    {
						      "parameterTypeId":"ININ.People.WorkgroupStats:Workgroup",
						      "value":workgroupId
						    }
						  ]
					};
		statData.push(statKey);
	}
	
	for(var x = 0 ; x< interactionStatIds.length; x++){
		var statId =interactionStatIds[x];
		var statKey = 	{
						  "statisticIdentifier":statId,
						  "parameterValueItems":
						  [
						    {
						      "parameterTypeId":"ININ.People.WorkgroupStats:Workgroup",
						      "value":workgroupId
						    },
						    {
						      "parameterTypeId":"ININ.Queue:Interval",
						      "value":interval
						    }
						  ]
					};
		statData.push(statKey);
	}
	
	sendRequest("PUT", sessionId + "/messaging/subscriptions/statistics/statistic-values",{
		'statisticKeys' : statData
	}, null);
	
}

function stopStatWatches(){
	sendRequest("DELETE", sessionId + "/messaging/subscriptions/statistics/statistic-values",null,null);
}
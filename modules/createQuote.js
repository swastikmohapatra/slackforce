"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    CREATEQUOTE_TOKEN = process.env.SLACK_CREATEQUOTE_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != CREATEQUOTE_TOKEN) {
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        params = req.body.text.split(":"),
        Name = params[0],
        OpportunityId = params[1];
		var opptyId;
		var q = 'Select id,Name from Opportunity where Name = \'' +OpportunityId+'\'';
		
		
		force.query(oauthObj, q)
        .then(data => {
				 let Oppty = JSON.parse(data).records;
				 if (Oppty && Oppty.length>0) {
						 Oppty.forEach(function(opp) {
						  opptyId =  opp.Id;
						  
						});
                }
     			 force.create(oauthObj, "Quote",
				 {
					Name: Name,
					OpportunityId : opptyId
				   

				 })
				.then(data => {
							let fields = [];
							fields.push({title: "OpportunityId", value: OpportunityId, short:false});
							fields.push({title: "Name", value: Name, short:false});
							fields.push({title: "Open in Salesforce:", value: oauthObj.instance_url + "/" + data.id, short:false});
							let message = {
								text: "A new Quote has been created:",
								attachments: [
									{color: "#F2CF5B", fields: fields}
								]
							};
							res.json(message);
				})
				.catch((error) => {
						if (error.code == 401) {
							res.send('Visit this URL to login to Salesforce: https://${req.hostname}/login/' + slackUserId);

						} else {
							res.send("An error as occurred");
						}
				});
		})
		.catch(error => {
            if (error.code == 401) {
               res.send('Visit this URL to login to Salesforce: https://${req.hostname}/login/' + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });
		
		
		

};

"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    CREATECASE_TOKEN = process.env.SLACK_CREATECASE_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != CREATECASE_TOKEN) {
        console.log("Invalid token");
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        q = "SELECT Id, CaseNumber,Status FROM Case WHERE CaseNumber LIKE '%" + req.body.text + "%' LIMIT 5";

    force.query(oauthObj, q)
        .then(data => {
            let cases = JSON.parse(data).records;
            if (cases && cases.length>0) {
                let attachments = [];
                cases.forEach(function(case1) {
                    let fields = [];
                    fields.push({title: "CaseNumber", value: case1.CaseNumber, short:true});
                    fields.push({title: "Status", value: case1.Status, short:true});
                    fields.push({title: "Open in Salesforce:", value: oauthObj.instance_url + "/" + case1.Id, short:false});
                    attachments.push({color: "#7F8DE1", fields: fields});
                });
                res.json({text: "Cases matching '" + req.body.text + "':", attachments: attachments});
            } else {
                res.send("No records");
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });
};
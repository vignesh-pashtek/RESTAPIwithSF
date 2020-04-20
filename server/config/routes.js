var jsforce = require('jsforce');

// Salesforce OAuth2 client information
var conn = new jsforce.Connection({
  oauth2 : {
    // you can change loginUrl to connect to sandbox or prerelease env.
    loginUrl : 'https://login.salesforce.com',
    clientId: process.env.Consumer_Key,
    clientSecret:  process.env.Consumer_Secret,
    redirectUri: process.env.Callback_URL,
  }
});

//all the routes for our application
module.exports = function(app,db,pgp) {
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });
         
   	app.get('/api/studentid/:sId', function(req, res) {
		      
        var sId = req.params.sId;   
        console.log('sId+'+sId);      
                  //WHERE s_id ="+sId+"::int"
		db.query("SELECT * FROM student where s_id="+sId+"", true)
	    .then(function (data) {
		console.log('data+'+data);
		var studentDtls = data;  

		conn.login(process.env.SF_Username, process.env.SF_PWD, function(err, userInfo) {
			  if (err) {  return res.redirect('/orders'); }
			  // Now you can get the access token and instance URL information.
			var records = [];  
			conn.query("SELECT DateTaken__c,ExamResult__c,MinutesTaken__c,Id,Name FROM Student__c WHERE Student_Id__c='"+sId+"' LIMIT 1", function(err, result) {

				if (err) { return res.status(500).json({ success: false,error : err}); }
				console.log("total : " + result.totalSize);
				console.log("fetched : " , result.records[0]);
				console.log("done ? : "+ result.done);
         
				records = result.records[0];
    			      
				if (result.totalSize != 0) {      
					// record updation
					conn.sobject("Student__c").update({   
						Id : result.records[0].Id,
						Name : result.records[0].name,     
						DateTaken__c: result.records[0].datetaken__c,
						ExamResult__c: result.records[0].examresult__c,
						MinutesTaken__c: result.records[0].minutestaken__c
						}, function(err, ret) {
						  if (err || !ret.success) { return console.error(err, ret); }
						     console.log("record Updated successfully : " + ret.id);
						   // ...
						 });        

				}else{
					// Single record creation
					conn.sobject("Student__c").create({         
						Name : studentDtls[0].name,     
						DateTaken__c: studentDtls[0].datetaken,
						ExamResult__c: studentDtls[0].examresult,
						MinutesTaken__c: studentDtls[0].minutestaken
						}, function(err, ret) {
						  if (err || !ret.success) { return console.error(err, ret); }
						     console.log("Created record id : " + ret.id);
						   // ...
						 });    	
				}  

			});
		});
			
	    
			
      /*	
      For Upsert
      conn.sobject("Student__c").upsert({ 
					Name : studentDtls[0].name,     
					DateTaken__c: studentDtls[0].datetaken,
					ExamResult__c: studentDtls[0].examresult,
					MinutesTaken__c: studentDtls[0].minutestaken,
					Student_Id__c: sId
				}, 'Student_Id__c', function(err, ret) {
				  if (err || !ret.success) { return console.error(err, ret); }
				  console.log('Upserted Successfully');
				  // ... 
				}); */
	    return res.json(data);

	    })
	    .catch(function (err) {
	        console.log("ERROR:", err); // print the error;
	        return res.status(500).json({ success: false,error : err});
	    })
	    .finally(function (){
	        // If we do not close the connection pool when exiting the application,
	        // it may take 30 seconds (poolIdleTimeout) before the process terminates,
	        // waiting for the connection to expire in the pool.
	
	        // But if you normally just kill the process, then it doesn't matter.
	        pgp.end(); // for immediate app exit, closing the connection pool.
	        // See also:
	        // https://github.com/vitaly-t/pg-promise#library-de-initialization
	    });
  	});
   
	
	
};

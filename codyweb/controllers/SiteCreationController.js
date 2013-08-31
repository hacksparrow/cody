//
// Laurens Ramandt - jul 2013 - Codyweb
//
//
console.log("loading " + module.id);

var mysql = require("mysql");
var cody = require("../../cody/index.js");
var ec = require("../../cody/controllers/EmailController");

module.exports = SiteCreationController;

function SiteCreationController(context) {
  var self = this;

  console.log("SiteCreationController.constructor");
  this.formView = "/sitecreation.ejs";

  // call inherited constructor
  cody.Controller.call(self, context);
}

// inheritance chain
SiteCreationController.prototype = Object.create( cody.Controller.prototype );


SiteCreationController.prototype.doRequest = function( finish ) {
  var self = this;
  var myVhost = self.context.req.headers.host;
  var lang = self.context.page.language;
  if (self.isRequest("sitecreation")) {
      //TODO: move this to model [JC: not really needed for me, if only used from within this controller]
      //TODO: configure baseURL
      self.query("select * from cody.websites where name=? OR hostname=?", [self.getParam("sitename"), self.getParam("hostname")], function(err, resultCheck){
          if(resultCheck.length > 0){
              self.feedBack(false, "duplicate-name");
              finish(self.formView);
          } else{
      var values = [self.getParam("sitename"), "", self.getParam("sitename"), self.getParam("password"), "localhost", "/usr/local/data/"+self.getParam("sitename"), self.getParam("sitename"), "N", self.getParam("hostname"), self.getParam("email"), "N"];

      self.query("insert into cody.websites (name, version, dbuser, dbpassword, dbhost, datapath, db, active, hostname, owneremail, ownerconfirmed) VALUES(?,?,?,?,?,?,?,?,?,?,?)", values,
          function(err, result){
              //console.log("err: " + err);

              // call finish only after the query has completed [JC]
              self.feedBack(true, "awaiting-activation");
              finish(self.formView);

          });

      //send activationmail
      var destinationMail = self.getParam("email");
      var code = require('crypto').createHash('md5').update(destinationMail).digest("hex"); //TODO: salt this hash
      var actMessage = "Hello,<br><br>";
      actMessage += "Welcome to Cody, the revolutionary node.js CMS.<br><br>";
      actMessage += "You just created your own website. Please confirm your e-mail address by clicking <a href='http://" + myVhost + "/" + lang + "/createsite?request=activate&code=" + code + "'>here</a>.<br><br>";
      actMessage += "Thank you,<br><br>The Cody team";
      ec.sendEmail("noreply@cody-cms.org", destinationMail, "Website activation", actMessage);
          }
      });

  } else if(self.isRequest("activate")){
      var values = [self.getParam("code")];
      self.query("update cody.websites SET ownerconfirmed='Y' WHERE MD5(owneremail) = ?", values, function(err, result){
          if(result.affectedRows > 0){
            self.feedBack(true, "activation-success");

              self.query("select hostname from cody.websites where md5(owneremail) = ?", values, function(err, result2){
                  var temp = result2;
                  self.context.params["url"] = "http://" + result2[0].hostname;
                  finish(self.formView);
              });


          }else{
            self.feedBack(false, "activation-fail");
              finish(self.formView);
          }
      });

  } else{
      finish(self.formView);
  }



};

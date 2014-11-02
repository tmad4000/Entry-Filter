// Hacking Email Really Quick

function sendApplicationStatusEmail(id) {
  var app = Applications.findOne({_id: id});
  var entry = Entries.findOne({_id: app.entryId});

  var personWhoApplied = Meteor.users.findOne({_id: app.userId}).profile.email;
  var from = 'mjgil@mit.edu';
  var subject = 'UROP Application Status Update - Student';
  var message = 'Hi, your application status has changed. Your application is now: ' + app.status;
  // findUserByEmail()
  Email.send({
    to: 'malcomgilbert@gmail.com',
    from: from,
    subject: subject,
    text: message
  });

  var others = [];
  if (entry.facultyAdvisorEmail) others.push(entry.facultyAdvisorEmail);
  if (entry.directSupervisorEmail) others.push(entry.directSupervisorEmail);
  if (entry.yourAdvisorEmail) others.push(entry.yourAdvisorEmail);

  others.forEach(function(email) {
    var subject = 'UROP Application Status Update - Advisor';
    var message = "Hi, an application status for a UROP you're advising has changed. This application is now: " + app.status;

    Email.send({
      to: 'malcomgilbert@gmail.com',
      from: from,
      subject: subject,
      text: message
    });
  });
}


Meteor.methods({
  'makeApplicationInactive': function(id) {
    console.log('makeApplicationInactive');
    // console.log(this);
    Applications.update({_id: id}, { $set: {'active': false}});
  },
  'makeApplicationOffered': function(id) {
    console.log('offered');
    Applications.update({_id: id}, { $set: {'status': 'offered'}});
    sendApplicationStatusEmail(id);
  },
  'makeApplicationFacultyRejected': function(id) {
    console.log('frejected');
    Applications.update({_id: id}, { $set: {'status': 'facultyRejected'}});
    sendApplicationStatusEmail(id);
  },
  'makeApplicationAccepted': function(id) {
    console.log('accepted');
    Applications.update({_id: id}, { $set: {'status': 'accepted'}});
    sendApplicationStatusEmail(id);
  },
  'makeApplicationStudentRejected': function(id) {
    console.log('rejected');
    Applications.update({_id: id}, { $set: {'status': 'studentRejected'}});
    sendApplicationStatusEmail(id);
  },
  'insertEntry': function(data) {
    console.log('insertEntry');
    data.creator = this.userId;
    var user = Meteor.users.findOne(this.userId);
    if (isStaff(user)) {
      data.approved = true;
    }
    Entries.insert(data);
  },
  'insertApplication': function(data) {
    console.log('insertApplication');
    data.userId = this.userId;
    Applications.insert(data);
  },
  'emailToId': function(email, callback) {
    console.log('emailToId');
    console.log(findUserByEmail(email)._id);
    callback(findUserByEmail(email)._id);
  },
  'ideaSearch': function(data) {
    console.log('ideaSearch');
    data.query.emailAddress = {$nin: ['']};
    var fields = {};
    fields.firstName = 1;
    fields.lastName = 1;
    fields.emailAddress = 1;
    fields.searchCache = 1;
    fields._id = 0;
    var limit = 25;
    data.other = {limit: limit, fields: fields}
    var retVal = [];
    if (data.type === 'dSupervisor') {
      data1 = MitFaculty.find(data.query, data.other).fetch();
      data2 = MitStudents.find(data.query, data.other).fetch();
      retVal = _.first(data1.concat(data2), limit);
    }
    else {
      retVal = MitFaculty.find(data.query, data.other).fetch();
    }
    return _.sortBy(retVal, function(obj) {return obj.searchCache});
  },
  'updateAdvisor': function(obj) {
    console.log('updateAdvisor');
    Meteor.users.update({_id: this.userId}, { $set: 
      {'profile.advisorName': userFullName(obj),
       'profile.advisorEmail': obj.emailAddress,
       'profile.advisor': obj 
      }
      });
  },
  'updatePortfolioLink': function(link) {
    console.log('updatePortfolioLink');
    // console.log(link);
    // console.log(this.userId);
    // console.log('user', Meteor.users.findOne(this.userId));
    Meteor.users.update({_id: this.userId}, { $set: {'profile.portfolioLink': link}});
  },
  'insertSavedEntry': function(entry) {
    console.log('insertSavedEntry');
    var userId = this.userId;
    var entryId = entry._id;
    var obj = {};
    obj.userId = userId;
    obj.entryId = entryId;
    obj.active = true;
    SavedEntries.insert(obj);
    return;
  },
  'insertHiddenEntry': function(entry) {
    console.log('insertHiddenEntry');
    var userId = this.userId;
    var entryId = entry._id;
    var obj = {};
    obj.userId = userId;
    obj.entryId = entryId;
    obj.active = true;
    HiddenEntries.insert(obj);
    return;
  },
  'removeSavedEntry': function(entry) {
    console.log('removeSavedEntry');
    var userId = this.userId;
    var entryId = entry._id;
    var obj = {};
    obj.userId = userId;
    obj.entryId = entryId;
    obj.active = true;
    SavedEntries.update(obj, {$set: {'active': false}});
    return;

  },
  'removeHiddenEntry': function(entry) {
    console.log('removeHiddenEntry');
    var userId = this.userId;
    var entryId = entry._id;
    var obj = {};
    obj.userId = userId;
    obj.entryId = entryId;
    obj.active = true;
    HiddenEntries.update(obj, {$set: {'active': false}});
    return;
    
  }
});
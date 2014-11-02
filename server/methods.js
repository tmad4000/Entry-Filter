Meteor.methods({

'ideaSearch': function(data) {
    console.log('ideaSearch');

    var limit = 25;
    data.other = {limit: limit}

    var retVal = [];

    retVal = Ideas.find(data.query, data.other).fetch();

    return _.sortBy(retVal, function(obj) {return obj.searchCache});
  }

});
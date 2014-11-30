Meteor.methods({

'ideaSearch': function(data, current_idea) {
    console.log('ideaSearch');

    var limit = 25;
    data.other = {limit: limit}

    var retVal = [];
    // console.log(data.query);
    retVal = Ideas.find(data.query, data.other).fetch();
    console.log(retVal.length)

    retVal = _.sortBy(retVal, function(obj) {return obj.searchCache}); // alphabetical 
    // retVal = _.sortBy(retVal, function(obj) {return -1*obj.date_created}); // date 
    
    if (CROSSBOARD_CONNECTIONS) { // Sorts by whether in current box, alphabetical
      retVal = _.sortBy(retVal, function(obj) {return obj.parent_id == current_idea._id ? 0 : 1});
    } 
    return retVal;
  },


'insertRelationBiServer':  function(src, target, relationship) {
    if (typeof relationship === 'undefined'){
        relationship = {weight:1,reviewed:true};
      }

      var newRelation ={}
      newRelation["relations."+target]=relationship

     Ideas.update({_id:src},{$set: newRelation})

     var newRelationBack ={}
     newRelationBack["relations."+src]=relationship
     Ideas.update({_id:target},{$set: newRelationBack}) 

	}
})
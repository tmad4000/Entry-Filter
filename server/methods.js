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

  },


'suggestRelationsServer':  function(current_idea) {

    ideas = Ideas.find({parent_id:current_idea._id}).fetch();
    ideasWithConcepts = _.map(ideas, function(i) {
      i.concepts=extractConcepts(i.text);
      return i
      // Ideas.update({_id:i._id},{$set: {concepts:extractConcepts(i)}});
    })
    

    

    for(var i=0;i<ideasWithConcepts.length;i++) {
      var newRelations = []
      for(var j=0;j<ideasWithConcepts.length;j++) {
        if(i==j)
          continue;
        //#hack
        if(ideasWithConcepts[i].relations&&ideasWithConcepts[i].relations[ideasWithConcepts[j]._id]) 
          continue;

        var relation = computeRelation(ideasWithConcepts[i].concepts,ideasWithConcepts[j].concepts);
        relation.idea1=ideasWithConcepts[i]
        relation.idea2=ideasWithConcepts[j]
        if(relation.weight >=1) {
          console.log("sugg rel",relation)
          newRelations.push(relation)
        }
      }
      console.log("newrel",newRelations)
      newRelations=_.sortBy(newRelations,function(r) { return r.weight})
      newRelations=newRelations.slice(0,Math.floor(Math.random()*3)); // #hack
      _.each(newRelations,function(r) {
        Meteor.call('insertRelationBiServer',r.idea1._id, r.idea2._id,  {weight: r.weight, concepts:r.concepts,reviewed: false})
      });

    }


	}
})
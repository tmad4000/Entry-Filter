//Ideas.update({_id: "iN9whhZMNjJ4e4wPy"}, {$set: {relatedIdeas: {}});
var ideas = hackathonIdeaList;
Ideas = new Meteor.Collection("ideas");


insertIdea = function(ideaData){

    //#validate #hack?
    if(!ideaData.text)
      return; 

    ideaData.title=ideaData.text.substr(0,50);

    var initSlug = ideaData.title.toLowerCase().replace(/ /g,'-').replace(/[^a-z0-9\-]/gi, '');


    var slug = initSlug;
    for (var n = 2; Ideas.find({slug: slug}).fetch().length > 0; ++n) {
      slug = initSlug + "-" + n;
      // #future Will be slow if many slug collisions
    }

    ideaData.slug=slug;

    return Ideas.insert(ideaData);
}

insertRelationBi = function(src, target, relationship) {
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

if (Meteor.isServer) {

    Meteor.startup(function() {
        // Ideas.remove({});   
        iray=[]
        if (Ideas.find().count() === 0) {
            root_id = insertIdea({text: "Hackathon Ideas"});
            ideas.forEach(function(idea) {
                idea["searchCache"] = idea["text"];
                idea["relations"] = {};
                idea["parent_id"] = root_id;
                idea["date_created"] = new Date().getTime();
                idea["status"] = 0;

                while(Math.random() < 0.5 && iray.length > 20){
                    idea["relations"][iray[Math.floor(iray.length * Math.random())]] = {weight: 1, reviewed: false};
                }
                

                iray.push(insertIdea(idea));
            });


            // sampleIdea={
            //     "author": "", 
            //     "initid": 127, 
            //     "text": "Testrelations idea"
            // }

            // sampleIdea["relations"] = {}
            // sampleIdea["relations"][iray[4]]={weight:1, reviewed:true}
            // sampleIdea["relations"][iray[5]]={weight:1, reviewed:false}


            // sampleIdea["parent_id"] = root_id;
            // sampleIdea["date_created"] = new Date().getTime();
            // sampleIdea["status"] = 0; 

            // insertIdea(sampleIdea);
       }


  

    });
}


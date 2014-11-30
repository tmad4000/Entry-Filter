
  // path: '/posts/:file(*)'
  /*
  Router.map(function() {
    // Home Route
    this.route('home', {path: '/'}); 

    */

// Router.route('/idea/:slug*', function() {
//   this.redirect('/idea/' + this.params.slug + '/')
// });

/*
Router.route('/idea/:_id(*)', function () {
  var path = this.params._id.split("/");
  console.log(path)
  var idea_id = path[path.length-1];
  var idea = Items.findOne({_id: idea_id});
  Session.set("current_idea", idea);
  this.render('idea_board');
});*/


  if (Meteor.isClient) {
    Session.setDefault("current_idea", {_id: null});
    Session.setDefault("current_view", DEFAULT_VIEW);
    Session.setDefault("importShow", false);


    var ideaHelpers={
      formatDate: function() {
        return moment(this.date_created).format('MMM Do, YYYY');
      },

      bolded_text: function() {
        text = this.text;
        search_input = Session.get("search_input");
        if (search_input) {
          text = text.replace(new RegExp('<b>', 'gi'), '');
          text = text.replace(new RegExp('</b>', 'gi'), '');
          text = text.replace(new RegExp("(" + search_input + ")", 'gi'), '<b>$1</b>');
        }
        return text;
      },
      splitted: function() {
        if (this.text !== undefined) {
          delims = ['--',':'];
          titleTxt = this.text.substr(0,80);
          for(i in delims) {
            titleTxt= Txt.substr(0,indexOf(delims[i]));
          }

          return {
            title: titleTxt,
            nontitle: this.text.substr(titleTxt.length)
          };
        }
      },

      hidden: function() {
        return this.hidden ? 'hidden':'';
      },

      title: function() {
        splitted = Template.idea.splitted();
      if (splitted !== undefined) {
        return splitted[0];
      }
    },

    relations: function() {
      return _.map(this.relations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        return {targetIdea:relation , weight: val.weight};
      });
    },
    manuallyReviewedRelations: function() {

      var manuallyReviewedRelations={}
      for (key in this.relations) {
        if (this.relations[key].reviewed && this.relations[key].weight > 0)
          // console.log(this.relations[key].weight)
          manuallyReviewedRelations[key] = this.relations[key];
      }

      return _.map(manuallyReviewedRelations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        // console.log(manuallyReviewedRelations);
        return {targetIdea:relation , weight: val.weight, reviewed:val.reviewed};
      });
    },    

    suggestedRelations: function() {
      var reviewedRelations={}
      for (key in this.relations) {
          if (!this.relations[key].reviewed)
            reviewedRelations[key] = this.relations[key];
      }

      return _.map(reviewedRelations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        return {targetIdea:relation , weight: val.weight, reviewed:val.reviewed};
      });
    },

    expandedIdeas: function() {
      return Template.instance().expandedIdeas.get();
    }
  }



  
  Template.idea.helpers(ideaHelpers)

  //#future #refactor
  var relationHelpers = ideaHelpers;
  relationHelpers.suggestedRelation=function() {
    return true;
  }
  // relationHelpers.expandedRelation=function(parentContext) {
  //   return parentContext.isExpanded(this.id)
  // }

  Template.relation.helpers(relationHelpers)

  Template.relation.events({

  'click .relation .deny': function(event) {
     var sourceId = Template.parentData(1)._id;

     var setReviewed ={}
     setReviewed["relations."+this.targetIdea._id+".reviewed"]=true;
     setReviewed["relations."+this.targetIdea._id+".weight"]=0;
     
     var oneDeny ={}
     oneDeny["relations."+this.targetIdea._id+".denies"]=1;

     Ideas.update({_id:sourceId},{$set: setReviewed, $inc:oneDeny})
     console.log(Ideas.findOne({_id:sourceId}))
      // Ideas.update({_id:this._id},{$set: {"relatedIdeas."+this.targetIdea._id: {reviewed:false}})

    },
  'click .relation .confirm': function(event) {
     var sourceId = Template.parentData(1)._id;

     var setReviewed ={}
     setReviewed["relations."+this.targetIdea._id+".reviewed"]=true;
     var oneConfirm ={}
     oneConfirm["relations."+this.targetIdea._id+".confirms"]=1;

     Ideas.update({_id:sourceId},{$set: setReviewed, $inc:oneConfirm})
     console.log(Ideas.findOne({_id:sourceId}))
    //   var $targetLink=$(event.target)
    //   var idToExpand=$targetLink.data("id");



    //   var expandedIdeas=Template.instance().expandedIdeas
    //   var expandedIdeasRay=expandedIdeas.get()

    //   var idExpanded=false
    //   var i 
    //   for( i = 0; i < expandedIdeasRay.length; i++){
    //     if(expandedIdeasRay[i]._id === idToExpand){
    //       idExpanded = true;
    //       break;
    //     }
    //   }

    //   if(idExpanded){

    //     $targetLink.parent().removeClass("expanded"); //#hack
    //     expandedIdeasRay.splice(i, 1);
    //     expandedIdeas.set(expandedIdeasRay);
    //   } else {
    //     $targetLink.parent().addClass("expanded"); //#hack
    //     expandedIdeasRay.unshift(Ideas.findOne({_id:idToExpand}));
    //     expandedIdeas.set(expandedIdeasRay);
    // }

  }
})

  Template.idea.created=function() {
    this.expandedIdeas=new ReactiveVar([]);
  }

  Template.idea.rendered=function() {
    
    //slideDown(1000);
  }

  Template.idea.events({
    'click .relation>a': function(event) {
      var $targetLink=$(event.target)
      var idToExpand=$targetLink.data("id");



      var expandedIdeas=Template.instance().expandedIdeas
      var expandedIdeasRay=expandedIdeas.get()

      // figure out if the currently clicked idea is already expanded
      var idExpanded=false;
      var hidden = true;
      var i;
      for( i = 0; i < expandedIdeasRay.length; i++){
        if(expandedIdeasRay[i]._id === idToExpand){
          idExpanded = true;
          if (!expandedIdeasRay[i].hidden) {
            hidden = false;
          }
          break;
        }
      }

     if(hidden){
        $targetLink.parent().addClass("expanded"); //#hack
        if(!idExpanded) {
          var newExpIdea=Ideas.findOne({_id:idToExpand});
          newExpIdea.hidden=false;
          expandedIdeasRay.unshift(newExpIdea);
        }
        else {
          expandedIdeasRay[i].hidden=false;
        }

        expandedIdeas.set(expandedIdeasRay);
    }
    else {
        
        $targetLink.parent().removeClass("expanded"); //#hack

        //expandedIdeasRay.splice(i, 1);
        expandedIdeasRay[i].hidden = true;
        
        expandedIdeas.set(expandedIdeasRay);
    }

    return false;

  },
    // 'click a': function(event) {
      // https://github.com/EventedMind/iron-location
      // history.pushState({}, '', $(event.target).attr("href"));
      // return false;

      //event.preventDefault();
      /* filter = Session.get("current_idea");
      filter = {};
      filter['parent_id'] = $(event.target).data("idea-id");
      Session.set("current_idea", filter); */
    // }
    'mousedown .statusIndicator' : function(e) {
      e.preventDefault();
      var incNum = 1;

      switch(e.which){
        case 1: //left click
          incNum = 1;
          break;
        case 3: //right click
          incNum = -1;
          break;
      }

      Ideas.update({_id:this._id},{$inc:{status:  incNum}});
      var currentStatus = Ideas.findOne({_id:this._id}).status
      if (currentStatus > 3) //#todo decide whether to include rejected
        Ideas.update({_id:this._id},{$set:{status: 0}});
      else if (currentStatus < 0) //#todo decide whether to include rejected
        Ideas.update({_id:this._id},{$set:{status: 3}});

      return false
    },
    'contextmenu' : function(){
     return false;
  }
  })





  Template.idea_form.events({
    'submit': function(event) {
      event.preventDefault();
      $input = $('.idea_text'); 
      var ideaData = {
        text: $input.val().trim(),
        parent_id: Session.get("current_idea")["_id"], 
        date_created: new Date().getTime(),
        status: 0 // open, pending, rejected, filled
      };

      insertIdea(ideaData);

      $input.val('');
      $('input[name=search]').val('');
      $('input[name=search]').keyup();
      $('textarea.idea_text').focus()
    },
    'keyup textarea.idea_text': function(e,t) {
      //#todo
      // if (e.ctrlKey && e.keyCode === 13) {
      //   window.afa=$(t).find('form.idea-form')
      //   console.log(aa=$(t).find('form.idea-form').)
      //   $(t).find('form.idea-form').submit();
      //   return false;
      // }



      var elem = $(e.currentTarget);
      var val = elem.val();
      $('input[name=search]').val(val);
    }
  })

  Template.idea_board.created = function() {



    Deps.autorun(function() {
      // This find() can be any reactive datasource
      var ideas = Ideas.find(Session.get("current_idea")).fetch();

      // If the filter already exists just update the dataset
      if (typeof ideaFilter === 'object' && ideaFilter !== null) {
        ideaFilter.updateDataset('text', ideas);
      } 
      else {
        // Otherwise initialize the filter
        ideaFilter = new DatasetFilter({
                            dataset: ideas,
                            queryKey: 'text'
                    });
      }

      var initializing = true;
      Ideas.find().observeChanges({
        added: function(id, doc) {

          if (!initializing) {

            // //Ideas.find({relations: {&lt: 3, relations: }}) 
            //             insertRelationBi(id,data.results['0']._id)
            // insertRelationBi(id,data.results['1']._id)
            // insertRelationBi(id,data.results['2']._id)

            // $.ajax({
            //   url: 'http://localhost:5000/compute_suggested_relations',
            //   data: {text:doc.text},
            //   jsonpCallback: 'jsonpCallback',
            //   contentType: "application/json",
            //   dataType: 'jsonp',
            //   success:  function(data) {
                
            //     console.log(data)

            //     insertRelationBi(id,data.results['0']._id)
            //     insertRelationBi(id,data.results['1']._id)
            //     insertRelationBi(id,data.results['2']._id)
            //   }
            // });

            // console.log(doc);
          }
        }
      });
      initializing = false;




    });
  }

  Template.idea_board.helpers({
    ideas: function() {
      var allIdeas = Ideas.find({parent_id: Session.get("current_idea")._id}, {sort: {date_created: -1}}).fetch();
      var allObjects = {};
      allIdeas.forEach(function(idea, i) {
        idea.children=Ideas.find({parent_id:idea._id}, {sort: {date_created: -1}}).fetch();
        idea.numChildren=idea.children.length;
        
        allObjects[idea._id] = i;
      });

      if (!Session.get('search_input')) {
        return allIdeas;
      }
      else {
        query = {parent_id: Session.get("current_idea")._id};
        query.text = {"$regex": new RegExp(Session.get("search_input"), 'i')}
        var searchedIdeas = Ideas.find(query, {sort: {date_created: -1}}).fetch();
        allIdeas.forEach(function(idea, i) {
          idea.hidden = true;
          allIdeas[i] = idea;

        });
        searchedIdeas.forEach(function(sidea) {
          var ideaIndex = allObjects[sidea._id];
          var idea = allIdeas[ideaIndex]; 
          idea.hidden = false;

          allIdeas[ideaIndex] = idea;

        });

        return allIdeas
      }
    },

    breadcrumb: function() {

      var breadcrumb=[];
      
      var currentIdeaIter=Session.get("current_idea");

      while(currentIdeaIter!==undefined && currentIdeaIter["_id"]!==null && currentIdeaIter["_id"] !== undefined) {
        breadcrumb.unshift(currentIdeaIter);

        var parentIdea=Ideas.findOne({_id:currentIdeaIter["parent_id"]});
        currentIdeaIter=parentIdea;
      } 

      breadcrumb.unshift({_id:null,slug:"",path:"/",title:"Root"});

      for(var i=1;i<breadcrumb.length;i++) {
        breadcrumb[i].path=breadcrumb[i-1].path+breadcrumb[i].slug+"/";
      }


      if(breadcrumb.length > 0) {
        breadcrumb[breadcrumb.length-1].last = true;
      }


      //for(var parent=Session.get("current_idea");parent!==null; parent=Ideas.find({_id:parent["parent_id"]})) {

      // }
      return breadcrumb;

      // if(parentIdea!==undefined) {
      //   return parentIdea.text.substr(0,50);
      // }
      // else {
      //   return "";
      // }
    },

    isListView: function() {
      return Session.get("current_view")==="list";
    },

    importShow: function() {
      return Session.get("importShow") ? "show" : "";
    }

  });

  Template.idea_board.events({
    'keyup': function () {
      // increment the counter when button is clicked
      Session.set("search_input", $('input[name=search]').val());
    },

 // 'a.breadcrumb': function(){
    //   // history.pushState({}, '', $(event.target).attr("href"));
    //   // return false;
    // },
    'click .import-link': function(){
      Session.set("importShow",!Session.get("importShow"))
      return false;
       // history.pushState({}, '', $(event.target).attr("href"));
       // return false;
     },
    'click .import-submit': function(e,t){
      var nodes = false;
      var edges = false;
      try {
        nodes = $.parseJSON($('.import-nodes').val().trim());
        edges = $.parseJSON($('.import-edges').val().trim());
      }      
      catch (err) {
        // Do something about the exception here
      }
      var textParam=$(".import-text-param").val() || "text"; 
      var detailParam=$(".import-detail-param").val() || false; 


      var msg = '';
      var nodeCount = 0;
      iray = [];
      if (nodes) {
         nodes.forEach(function(idea) {
                if (idea._id) 
                  delete idea._id;

                idea["text"]=idea[textParam] || "";

                if (detailParam && idea[detailParam]) {
                  idea["text"]+="\n\n -- " + idea[detailParam];
                  console.log(idea[detailParam])
                }

                idea["searchCache"] = idea["text"];
                idea["relations"] = {};
                idea["parent_id"] = Session.get("current_idea")._id;
                idea["date_created"] = new Date().getTime();
                idea["status"] = 0;


                iray.push(insertIdea(idea));
                nodeCount++;
            });

         msg += (nodeCount) + ' nodes successfully imported. '
      }
      else {
        msg += 'No nodes imported. ';
      }

      var edgeCount = 0;
      if (edges) {
         edges.forEach(function(edge) {
                insertRelationBi(iray[edge.source], iray[edge.target])
              
                edgeCount++;
            });

         msg += (edgeCount) + ' edges successfully imported. '
      }
      else {
        msg += 'No edges imported. ';
      }

     


      console.log(msg)
      return false;
       // history.pushState({}, '', $(event.target).attr("href"));
       // return false;
     },



    'click .suggest-relations': function(e,t){
      
      var is = Ideas.find({parent_id: Session.get("current_idea")._id}).fetch();
      is.forEach(function(idea) {
        if (Math.random()>.7) {
          console.log("reladded")
          Meteor.call('insertRelationBiServer',idea._id, is[Math.floor(is.length * Math.random())]._id,  {weight: 1, reviewed: false})
        }
      })
                
    },
    'click .import-submit': function(e,t){
      var nodes = false;
      var edges = false;
      try {
        nodes = $.parseJSON($('.import-nodes').val().trim());
        edges = $.parseJSON($('.import-edges').val().trim());
      }      
      catch (err) {
        // Do something about the exception here
      }
      var textParam=$(".import-text-param").val() || "text"; 
      var detailParam=$(".import-detail-param").val() || false; 


      var msg = '';
      var nodeCount = 0;
      iray = [];
      if (nodes) {
         nodes.forEach(function(idea) {
                if (idea._id) 
                  delete idea._id;

                idea["text"]=idea[textParam] || "";

                if (detailParam && idea[detailParam]) {
                  idea["text"]+="\n\n -- " + idea[detailParam];
                  console.log(idea[detailParam])
                }

                idea["searchCache"] = idea["text"];
                idea["relations"] = {};
                idea["parent_id"] = Session.get("current_idea")._id;
                idea["date_created"] = new Date().getTime();
                idea["status"] = 0;


                iray.push(insertIdea(idea));
                nodeCount++;
            });

         msg += (nodeCount) + ' nodes successfully imported. '
      }
      else {
        msg += 'No nodes imported. ';
      }

      var edgeCount = 0;
      if (edges) {
         edges.forEach(function(edge) {
                insertRelationBi(iray[edge.source], iray[edge.target])
              
                edgeCount++;
            });

         msg += (edgeCount) + ' edges successfully imported. '
      }
      else {
        msg += 'No edges imported. ';
      }

     


      console.log(msg)
      return false;
      // history.pushState({}, '', $(event.target).attr("href"));
      // return false;
    }
  });

  


  UI.registerHelper('addKeys', function (all) {
    return _.map(all, function(i, k) {
      return {key: k, value: i};
    });
  });

  function arrayEqual(a1, a2){
    _.isEmpty(_.difference(array1, array2))
  }
}



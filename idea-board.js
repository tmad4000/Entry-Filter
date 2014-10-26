  // path: '/posts/:file(*)'
  /*
  Router.map(function() {
    // Home Route
    this.route('home', {path: '/'}); 

    */

    Router.map(function(){
      this.route('', {
        path: '/',
        data: function(){
          Router.go('/idea/')
        }
      });




      this.route('idea_board', {
        path: '/idea/:slug(*)',
        data: function() {
          var path = this.params.slug.split("/");

          if(path.length<=1) {
            idea_slug = null;
            current_idea = {_id:null,slug: null}
          }
          else {
            var idea_slug = path[path.length-2];
            var current_idea;
            if(idea_slug === ''){
            }
            else {
              current_idea = Ideas.findOne({slug: idea_slug});
            }
          }


          Session.set("current_idea", current_idea);
        }
      })

  /*
  Router.route('/idea/:_id(*)', function () {
    var path = this.params._id.split("/");
    console.log(path)
    var idea_id = path[path.length-1];
    var idea = Items.findOne({_id: idea_id});
    Session.set("current_idea", idea);
    this.render('idea_board');
  });*/
});




  if (Meteor.isClient) {

    Session.setDefault("current_idea", {_id: null});


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
        return this.hidden;
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
    confirmedRelations: function() {

      var confirmedRelations={}
      for (key in this.relations) {
          if (!this.relations[key].unconfirmed)
            confirmedRelations[key] = this.relations[key];
      }

      return _.map(confirmedRelations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        console.log(confirmedRelations);
        return {targetIdea:relation , weight: val.weight, unconfirmed:val.unconfirmed};
      });
    },    

    suggestedRelations: function() {
      var unconfirmedRelations={}
      for (key in this.relations) {
          if (this.relations[key].unconfirmed)
            unconfirmedRelations[key] = this.relations[key];
      }

      return _.map(unconfirmedRelations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        return {targetIdea:relation , weight: val.weight, unconfirmed:val.unconfirmed};
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
      console.log("relid",this.targetIdea._id)
      // Ideas.update({_id:this._id},{$set: {"relatedIdeas."+this.targetIdea._id: {unconfirmed:false}})

    },
  'click .relation .confirm': function(event) {
      console.log("relid",this.targetIdea._id)
     // Ideas.update({_id:this._id},{$set: {"relatedIdeas.".concat(this.targetIdea._id): {unconfirmed:false}}})
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

  Template.idea.events({
    'click .relation>a': function(event) {
      var $targetLink=$(event.target)
      var idToExpand=$targetLink.data("id");



      var expandedIdeas=Template.instance().expandedIdeas
      var expandedIdeasRay=expandedIdeas.get()

      var idExpanded=false
      var i 
      for( i = 0; i < expandedIdeasRay.length; i++){
        if(expandedIdeasRay[i]._id === idToExpand){
          idExpanded = true;
          break;
        }
      }

      if(idExpanded){

        $targetLink.parent().removeClass("expanded"); //#hack
        expandedIdeasRay.splice(i, 1);
        expandedIdeas.set(expandedIdeasRay);
      } else {
        $targetLink.parent().addClass("expanded"); //#hack
        expandedIdeasRay.unshift(Ideas.findOne({_id:idToExpand}));
        expandedIdeas.set(expandedIdeasRay);
    }

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
    }
  })

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
          idea.hidden = 'hidden';
          allIdeas[i] = idea;

        });
        searchedIdeas.forEach(function(sidea) {
          var ideaIndex = allObjects[sidea._id];
          var idea = allIdeas[ideaIndex]; 
          idea.hidden = '';

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
    }
  });

  Template.idea_board.events({
    'keyup': function () {
      // increment the counter when button is clicked
      Session.set("search_input", $('input[name=search]').val());
    },

    'a.breadcrumb click': function(){
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
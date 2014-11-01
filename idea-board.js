
  // path: '/posts/:file(*)'
  /*
  Router.map(function() {
    // Home Route
    this.route('home', {path: '/'}); 

    */


Router.route('/', function(){
    this.redirect('/idea/')
});

Router.route('/idea/:slug*', function() {
    var current_idea;
    if(!this.params.slug) {
      current_idea = {_id:null,slug: null}
    } else {
      var path = this.params.slug.replace(/\/$/, '').split("/");
      
      var idea_slug = path[path.length-1];
      
      current_idea = Ideas.findOne({slug: idea_slug});
    }
    Session.set("current_view", this.params.query.graph !== undefined? 'graph' : 'list')
    Session.set("current_idea", current_idea);
    this.render('idea_board')

});


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
    Session.setDefault("current_view", "list");


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
    manuallyReviewedRelations: function() {

      var manuallyReviewedRelations={}
      for (key in this.relations) {
          if (this.relations[key].reviewed)
            manuallyReviewedRelations[key] = this.relations[key];
      }

      return _.map(manuallyReviewedRelations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        console.log(manuallyReviewedRelations);
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
    },

    isListView: function() {
      return Session.get("current_view")!=="graph";
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


  Template.graph.rendered = function () {
    console.log(this)

    var svg, 
        width = 700, 
        height = 700;
    
    var data = d3.range(100).map(function(i) {
      return {index: i};
    });
    // var data = Ideas.find(
    //   {sort: {date_created: -1}})
    // .fetch().map(function(e, i){
    //   return {index: i}
    // })

    var fill = d3.scale.category10();

    function tick(e) {

      // Push different nodes in different directions for clustering.
      var k = 6 * e.alpha;
      data.forEach(function(o, i) {
        o.y += i & 1 ? k : -k;
        o.x += i & 2 ? k : -k;
      });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }



    var force = d3.layout.force()
      .nodes(data)
      .size([width, height])
      .on("tick", tick)
      .start();


    svg = d3.select('#viz').append('svg')
      .attr('width', width)
      .attr('height', height);

    var node = svg.selectAll(".node")
      .data(data)
    .enter().append("circle")
      .attr("class", "node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", 8)
      .style("fill", function(d, i) { return fill(i & 3); })
      .style("stroke", function(d, i) { return d3.rgb(fill(i & 3)).darker(2); });

    force.resume()






    // Circles.find().observe({
    //   added: function () {
    //     x = d3.scale.ordinal()
    //       .domain(d3.range(Circles.findOne().data.length))
    //       .rangePoints([0, width], 1);
    //     drawCircles(false);
    //   },
    //   changed: _.partial(drawCircles, true)
    // });
  }; 


  UI.registerHelper('addKeys', function (all) {
    return _.map(all, function(i, k) {
      return {key: k, value: i};
    });
  });

  function arrayEqual(a1, a2){
    _.isEmpty(_.difference(array1, array2))
  }
}



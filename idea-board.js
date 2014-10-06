if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault("counter", 0);
  Session.setDefault("current_idea", {parent_id: null});

  Template.idea.helpers({
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
          titleTxt=titleTxt.substr(0,indexOf(delims[i]));
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
      // console.log(splitted);
      if (splitted !== undefined) {
        return splitted[0];
      }
    }
  })

  Template.idea.events({
    'click a': function(event) {
      event.preventDefault();
      filter = Session.get("current_idea");
      filter = {};
      filter['parent_id'] = $(event.target).data("idea-id");
      Session.set("current_idea", filter);
    }
  })

  Template.idea_form.events({
    'submit': function(event) {
      event.preventDefault();
      $input = $('input[name=idea_text')

      Ideas.insert({text: $input.val(), parent_id: Session.get("current_idea")["parent_id"]});

      $input.val('');
    }
  })

  Template.idea_board.helpers({
    ideas: function() {
      var allIdeas = Ideas.find(Session.get("current_idea")).fetch();
      var allObjects = {};
      allIdeas.forEach(function(idea, i) {
        allObjects[idea._id] = i;
      });
      if (!Session.get('search_input')) {
        console.log('here');
        return allIdeas;
      }
      else {
        query = Session.get("current_idea");
        query.text = {"$regex": new RegExp(Session.get("search_input"), 'i')}
        var searchedIdeas = Ideas.find(query, {"$sort": {"$natural": -1}}).fetch();
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
      return Session.get("current_idea").parent_id;
    }
  });

  Template.idea_board.events({
    'keyup': function () {
      // increment the counter when button is clicked
      Session.set("search_input", $('input[name=search]').val());
    }
  });
}
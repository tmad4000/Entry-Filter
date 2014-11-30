if (Meteor.isClient) {
  updateAutoCompleteTemplate = function(obj, t) {
    Session.set(t.id, obj);
    t.input.set(obj.searchCache);

    var sourceId = t.data.id;
    var targetIdea=obj;

     var newRelation ={}
     newRelation["relations."+targetIdea._id]={weight:1,reviewed:true}

     Ideas.update({_id:sourceId},{$set: newRelation})

     var newRelationBack ={}
     newRelationBack["relations."+sourceId]={weight:1,reviewed:true}
     Ideas.update({_id:targetIdea._id},{$set: newRelationBack})     


     console.log(Ideas.findOne({_id:sourceId}))
  }

  updateAutoCompleteUI = function(obj, t) {
    // console.log('this', this);
    t.$('.autoCompEntry').blur();
    t.$('.autoCompEntry').val("");
  }


  Template.entryAutoComplete.created = function() {
    // console.log('created', this);
    this.active = new ReactiveVar(false);
    this.input = new ReactiveVar('');
    this.lastSearch = ''; 
    this.optionsDep = new Tracker.Dependency;
    this.options = [];
    this.id = this.data.id;
    this.showError = new ReactiveVar(false);
  }


  Template.entryAutoComplete.helpers({
    filteredIdeas: function() {
      var t = Template.instance();
      var input = t.input.get();
      if (t.lastSearch === input) {
        return t.options;
      }
      t.lastSearch = input;
      var query = {'searchCache': {$regex: input, $options: 'i'},
                  'parent_id': Session.get("current_idea")._id};
      var data = {type: this.id, query: query};
      // console.log('filtered', Meteor.call('ideaSearch', data));
      Meteor.call('ideaSearch', data, function(e, options) {
        t.options = options;
        t.optionsDep.changed();
      });

      t.optionsDep.depend();
      return t.options;
    },
    searchCacheBold: function(which) {
      var t = Template.instance();
      var input = t.input.get();
      var regex = new RegExp("(" + input + ")", 'gi');
      var text = this.searchCache;
      if (input) {
        text = text.replace(regex, '<b>$1</b>');
      }
      return text;
    },
    showError: function() {
      var t = Template.instance();
      if (t.showError.get()) {
        return '';
      }
      return 'hidden';
    },
    showideaSearch: function(which) {
      // console.log('showFacSearch');
      var t = Template.instance();
      if (t.input.get() && t.active.get()) {
        return '';
      }
      return 'hidden';
    }
  })


  Template.entryAutoComplete.events({
    'keyup .autoCompEntry': function(e, t) {
      e.preventDefault();
      e.stopPropagation();
      var input = $(e.currentTarget).val();
      t.input.set(input);
      if (!input) Session.set(t.id, null);
    },
    'focus .autoCompEntry': function(e, t) {
      t.showError.set(true);
      t.active.set(true);
    },
    'focusout .autoCompEntry': function(e, t) {
      t.active.set(false);
    },
    'mousedown .filtFac': function(e, t) { 
      // need mousedown to fire before the focusout
      e.preventDefault();
      e.stopPropagation();
      updateAutoCompleteTemplate(this, t);
      updateAutoCompleteUI(this, t);
      t.showError.set(false);
    }
  })

};
Router.route('/', function(){
    this.redirect('/idea/')
});

Router.route('/idea/:slug*', function() {


  // Only on the first application load
  if(!$.inArray(Session.get("current_view"),['list','graph'])) {
    Session.setDefault("current_view", DEFAULT_VIEW);
  }

    
    var current_idea;
    if(!this.params.slug) {
      this.params.slug="";
      current_idea = {_id:null,slug: null}
    } else {
      var path = this.params.slug.replace(/\/$/, '').split("/");
      
      var idea_slug = path[path.length-1];
      
      current_idea = Ideas.findOne({slug: idea_slug});
    }

    if(this.params.query.graph !== undefined) {
      Session.set("current_view", 'graph')
    }
    else if (this.params.query.list !== undefined) {
      Session.set("current_view",  'list')
    }
    else {
      if(Session.get("current_view")!==DEFAULT_VIEW)
        this.redirect('/idea/'+this.params.slug+"?"+Session.get("current_view"));
    }

    Session.set("current_idea", current_idea);
    this.render('idea_board')

});
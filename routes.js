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
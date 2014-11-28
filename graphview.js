if (Meteor.isClient) {

Template.graph.helpers({
    selected_idea: function(){
      return Session.get("selected_idea")
      // return "323e092u34"
    }
  })


  Template.graph.rendered = function () {
    var svg, 
        width = 900, 
        height = 900;

    var mousedown_node;

    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("pointer-events", "none").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("pointer-events", "none").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }
    function zoom() {
      svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    svg = d3.select('#viz')
      .attr('width', width)
      .attr('height', height)
      .append("g")
        .call(d3.behavior.zoom().scaleExtent([0.1, 8]).on("zoom", zoom))
      .append("g")
    
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height);

    // line displayed when dragging new nodes
    var drag_line = svg.append('svg:path')
      .attr('class', 'dragline hidden')
      .attr('d', 'M0,0L0,0');

    var force = d3.layout.force();

    // define arrow markers for graph links
    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#000');

    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'start-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 4)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', '#000');


    svg
      .on('mousemove', function(d){  
        // update drag line
        if(mousedown_node) {
          drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
        }
        
      })
      .on('mouseup', function(d){
        if(mousedown_node) {
          // hide drag line
          drag_line
            .classed('hidden', true)
            .style('marker-end', '');
          force.resume();

          mousedown_node = null;
        }
      })


    var fill = d3.scale.category10();
    // console.log(ideas)

    Tracker.autorun(function () {
      var id = Session.get("current_idea");
      if(!id) return;

      console.log(id, 'current idea id')
      var ideas = Ideas.find(
        { parent_id: id._id }, 
        {sort: {date_created: 1}}
      ).fetch();

      // #future for related ideas outside current scope
      // var related_ids = _.uniq(_.flatten(ideas.map(function(e){
      //   return Object.keys(e.relations)
      // })));

      // var related_ideas = Ideas.find({_id: {$in: related_ids}}).fetch();
      // console.log('related idea', related_ideas, related_ids);

      var indexmap = {};
      var data = ideas.map(function(e, i){
        indexmap[e._id] = i;
        return { index: i, weight: 1, idea: e, width: 50, height: 20 }
      });
      
      
      var links = _.flatten(ideas.map(function(idea, i){
        return Object.keys(idea.relations || {}).filter(function(relative){
          return relative in indexmap
        }).map(function(relative){
          return {
            source: i,
            target: indexmap[relative]
          }
        })
      }));


      function tick(e) {
        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        // labels.attr("x", function(d) { return d.x; })
        //     .attr("y", function(d) { return d.y; });

        labels.attr("transform", function(d){
          return "translate(" + (d.x + 10) +"," + (d.y - 10) + ")"
        })

        link.attr("x1", function(d) { return d.source.x ; })
            .attr("y1", function(d) { return d.source.y ; })
            .attr("x2", function(d) { return d.target.x ; })
            .attr("y2", function(d) { return d.target.y ; });

      }

      force
        .distance(80)
        .charge(-400)
        .nodes(data)
        .links(links)
        .size([width, height])
        .on("tick", tick)
        // .resume()
        .start()

      
      var link = svg.selectAll(".link")
        .data(links);
      
      link.exit().remove();

      link
        .enter().append("line")
          .attr("class", "link");
      

      var node = svg.selectAll(".node")
        .data(data);

      node.exit().remove();

      node.enter().append("circle")
        .attr("class", "node")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("width", function(d){ return d.width })
        .attr("height", function(d){ return d.height })
        .attr("r", 8)
         .style("fill", function(d, i) {  return d.idea.color || "#CCC"; })
        .style("stroke", function(d, i) { return d3.rgb(fill(3)).darker(2); })
        // .call(drag)
        .on('click', function(d){
          // console.log('onclick')
          // d3.select(this).classed("fixed", d.fixed = true);
          Session.set("selected_idea", d)
        })
        .on('mousedown', function(d){
          d3.event.stopPropagation()
          // console.log('mousing down')
          // reposition drag line
          mousedown_node = d;
          force.stop()

          drag_line
            .style('marker-end', 'url(#end-arrow)')
            .classed('hidden', false)
            .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
        })
        .on('mouseup', function(d){
          console.log('test test test test')
          if(mousedown_node && mousedown_node != d){
            // links.push({source: mousedown_node, target: d})
            // console.log('mousing up', mousedown_node, d) 
            var sourceId = mousedown_node.idea._id;
            var targetId = d.idea._id;

            var newRelation ={}
            newRelation["relations."+targetId]={weight:1,reviewed:true}

            Ideas.update({_id:sourceId},{$set: newRelation})
            var newRelationBack ={}
            newRelationBack["relations."+sourceId]={weight:1,reviewed:true}
            Ideas.update({_id:targetId},{$set: newRelationBack})     

          }
        })
        .on('mouseover', function(d){
          // console.log('mouse over', d)
          // var nodeSelection = d3.select(this).style({opacity:'0.8'});
          // nodeSelection.select("text").style({opacity:'1.0'});
          Session.set("selected_idea", d)
          d3.select(this).classed("focused", true)

        })
        .on('mouseout', function(d){
          d3.select(this).classed("focused", false)
          // Session.set("selected_idea", null);
        })
        
      var labels = svg.selectAll(".nodelabels")
        .data(data);

      labels.enter().append("text")
        .attr("class", "nodelabels")
        .attr("x", function(d) { return 0; })
        .attr("y", function(d) { return 0; })
        // .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .attr("font-size", "9px")
        .attr("dy", ".71em")
        .text(function(d) {
            return d.idea.title;
        })
        .call(wrap, 100)

      labels.exit().remove();

      force.resume()


    });

    
    // https://gist.github.com/alx/5337474

 
    // sigma.publicPrototype.modulate = function() {
    //   if(!this.modularity) {
    //     var sigmaInstance = this;
    //     var mod = new Modularity(sigmaInstance._core);
    //     sigmaInstance.modularity = mod;
    //   }

    //   this.modularity.computeModularity();

    //   return this;
    // }
    


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
};
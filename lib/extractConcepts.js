extractConcepts = function(idea){
  idea=idea.toLowerCase();

      var   wordlist,
        ix,
        word,
        stem,
        overlap = [],
        stemmed = [],
        concepts={};
        
      // dump non-words
      idea = idea.replace(/[^\w]/g, ' ');

      // dump multiple white-space
      idea = idea.replace(/\s+/g, ' ');

      // split
      wordlist = idea.split(' ');

      for(ix in wordlist) {
        if(ix in STOPWORDS)
          continue;

        stem = stemmer(wordlist[ix]);
         // stemmed.push(stem);
         concepts[stem]=true
      }
      return concepts
      //document.getElementById('overlap').innerHTML = overlap.join(' ');
    }


computeRelation = function(idea1Concepts, idea2Concepts) {
      score=0;
      ptsOfTangency=[];
      for(concept in idea1Concepts) {

          console.log("tan",concept)
        if(concept in idea2Concepts) {
          score++;
          ptsOfTangency.push(concept);
        }
      }       

      return {weight:score,concepts:ptsOfTangency};
    }

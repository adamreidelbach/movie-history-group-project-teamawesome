"use strict";

let $ = require('jquery'),
    db = require("./db-interaction"),
    Handlebars = require('hbsfy/runtime'),
    templates = require("./dom-builder"),
    user = require("./user"),
    sort = require("./manipulation"),
    populate = require("./dom-builder");
    // rater = require('./rating');

// Handlebars helper that works with bootstrap grid system to form rows between every 3 items.
Handlebars.registerHelper('grouped_each', function(every, context, options) {
    var out = "", subcontext = [], i;
    if (context && context.length > 0) {
        for (i = 0; i < context.length; i++) {
            if (i > 0 && i % every === 0) {
                out += options.fn(subcontext);
                subcontext = [];
            }
            subcontext.push(context[i]);
        }
        out += options.fn(subcontext);
    }
    return out;
});

Handlebars.registerHelper({eq: function (v1, v2) {
    return v1 === v2;
}});

function loadMoviesToDOM (type) {
	let currentUser = user.getUser();
    console.log("current user is", currentUser);
	db.getMyMovies(currentUser)
	.then(function(data) {
       // console.log("the data on loadMoviesToDOM is", data);
		var allMovies = Object.keys(data);  //give keys to data to id buttons
		let myMoviesArray = [];
		allMovies.forEach( (key) => {
			data[key].id = key;
			myMoviesArray.push(data[key]);
		});

		// console.log('data', data);

		console.log("myMoviesArray", myMoviesArray);
		templates.populateCards(myMoviesArray);
	});
}

function getNewMovies (search) {
 	let newMovieList = [];
	templates.newMovieList(newMovieList);
}

function showWatched(event){
    let currentUser = user.getUser();
    console.log("current user is", currentUser);
    db.getwatchedMovies(currentUser)
    .then(function(data) {
        //console.log("the data on loadMoviesToDOM is", data);
        var allMovies = Object.keys(data);  //give keys to data to id buttons
        let myMoviesArray = [];
        allMovies.forEach( (key) => {
            data[key].id = key;
            myMoviesArray.push(data[key]);
        });

    templates.populateCards(myMoviesArray);
       // console.log("my movies array on show watched",myMoviesArray);
    });
}



$("#showWatched").click( (event) => {
  showWatched();
});

$("#showUnwatched").click( () => {
    loadMoviesToDOM();
});

$(document).on( "click", ".star", function(event){

    let card= event.target.closest(".card");
    let title= card.querySelector(".cardTitle").innerText;
    let date= card.querySelector(".cardDate").innerText;
    let actors= card.querySelector(".cardActors").innerText;
    let poster= card.querySelector('.cardImages').src;
    let objId = card.id;
    let rated = $(this).data("count");

    var addToWatchedObj = {
        title: title,
        actors: actors,
        releaseDate: date,
        poster: poster,
        ratings: rated,
        boolean: true,
        fb: "fb",
        id: objId
    };

    $("#breadcrumb").html(`<a href="#!" class="breadcrumb black-text">Search Results</a>`);
    $("#breadcrumb").append(`<a href="#!" class="breadcrumb black-text">Watched</a>`);

    console.log("addToWatchedObj", addToWatchedObj);
	db.setRating(addToWatchedObj, addToWatchedObj.id)
    .then(function(event){
        showWatched();
    });
});

$("#unTracked").click( () => {
	let input = $("#searchInput").val();
		// console.log("input", input);
		db.getNewMovies(input)
		.then(function(moviesArray){
			moviesArray.forEach(function(element){
				// console.log("element", element);
				db.getNewMoviesCredits(element.id)
				.then(function(actorsArray){
					element.actors = actorsArray;
					populate.populateCards(moviesArray);
				});
			});
		});
});

$("#searchInput").keyup( (keyin) => {
	if(keyin.keyCode == 13) {
		//highlight  "show untracked" button
		let input = $("#searchInput").val();
		// console.log("input", input);
		db.getNewMovies(input)
		.then(function(moviesArray){
			moviesArray.forEach(function(element){
				// console.log("element", element);
				db.getNewMoviesCredits(element.id)
				.then(function(actorsArray){
					element.actors = actorsArray;
					populate.populateCards(moviesArray);
				});
			});
		});
	}
});



$("#auth-btn").click( () => {
	if(user.getUser() === null) {  //if there is no user logIn, otherwise logout
		user.logInGoogle().
		then( () => {
			$("#mainContainer").removeClass("hide");
			$(".headerTitle").addClass("hide");
            $("#movieDiv").removeClass("hide");
            $("#filterDiv").removeClass("hide");
			},
			() => { window.alert("Failed to log in");}
		);
	}else {
		user.logOut();
		$("#mainContainer").addClass("hide");
        $(".headerTitle").removeClass("hide");
		$("#movieDiv").addClass("hide");
        $("#filterDiv").addClass("hide");
	}
});

function buildMovieObj(id) {
    let movieObj = {
    name: $(id).data("title"),
    actors: $(id).data("actors"),
    year: $(id).data("year"),
    picture: $(id).data("picture"),
    watched: false,
    rating: 0,
    uid: user.getUser(),
    movieId: $(id).data("id")
  };
  return movieObj;
}

// $(document).on("click", ".addToWatchList", function() {
// 	let newMovie = buildMovieObj(this);
// 	db.addMovie(newMovie);
// 	$("#id${movieId}").addClass("addedToWatch"); //maybe make this class grey out
// });

$(document).on('click', ".addtowatch", function(event){
    let watchAdd= event.target.parentElement;
    let title= watchAdd.querySelector(".cardTitle").innerText;
    let date= watchAdd.querySelector(".cardDate").innerText;
    let actors= watchAdd.querySelector(".cardActors").innerText;
    let card= watchAdd.closest(".card");
    let poster= card.querySelector('.cardImages').src;

    alert("Added to your watchlist");

    //console.log("poster shit", poster);
    let userName= user.getUser();
    if(userName=== null){
        console.log("no valid user");
        alert("You must be logged in to add to your watch list");
    }else{
    var addToWatchlistObj = {
        title: title,
        actors: actors,
        releaseDate: date,
        poster: poster,
        ratings: 0,
        boolean: false,
        fb: "fb",
        user: userName
    };
    console.log(addToWatchlistObj);
    db.addMovieToFB(addToWatchlistObj);
    return addToWatchlistObj;
    }
});

// $(document).on("click", ".rating", function() {
// 	let movieId = $(this).data("movie-id");
// 	let rater = $(this).rater();
// 	let rating = rater.rater("rating");
// 	db.setRating(movieId, rating);
// });

$(document).on('click', '.card', function(event) {
  let stars = $(event.currentTarget).find('.rating .star');
    for (let i = 0; i < stars.length; i++) {
      if ($(event.target).data('count') >= $(stars[i]).data('count')) {
        $(stars[i]).addClass('true');
      } else {
        $(stars[i]).removeClass('true');
      }
    }

});

$(document).on("click", ".delete", function() {
    let watchAdd= event.target.parentElement;
    let card= watchAdd.closest(".card");
    let movieId = card.id;
    console.log("card", card.id);
    console.log("movieId", movieId);
    console.log("delete button clicked");
	db.deleteMovie(movieId)
    .then(function(){
        loadMoviesToDOM();
    });
});



// db.addMovie('Billy Madison');

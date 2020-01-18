'use strict';
const superagent = require('superagent');
const express = require('express');
const app = express();
require('dotenv').config();


const cors = require('cors');
let locations = {};

// database connection set up
const pg =require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on ('error', err => {throw err;});

//  Declare variable
app.use(cors());
const PORT = process.env.PORT || 3001;

// use corss to allow to past data to front end

app.use(cors());
app.get('/location', locationHandler);


// define routes
function locationHandler(request, response) {

  try {
    // const dataArray = require('./data/geo.json');
    let city = request.query.city;
    let key = process.env.GEOCODE_API_KEY;
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
    let SQL = 'select * from locations where search_query = $1;';
    let values = [city];



    return client.query(SQL, values)
      .then(result => {
        // console.log(result);

        // if there is a city in DB
        // results.rows = ['seattle', '55585']

        // if theres no city in the DB
        // results.rowss = [];
        if (result.rowCount) {
          console.log(result.rows);
          response.send(result.rows[0]);
        }
        // hit this condition when there isn't city searched in database
        else {
          superagent.get(url)
            .then(data => {
              // add to DB
              const geoData = data.body[0];
              const location = new Location(city, geoData);
              locations[url] = location;
              response.send(location);
            })
            .catch(() => {
              errorHandler('If you did not get result. Please, try again', request, response);
            });


        }

      });


  }
  catch(error) {
    errorHandler('If you did not get results. Please try again.', response);
  }
}






app.get('/weather', (request, response) => {

  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  // let {latitude, longitude} = request.query;

  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${latitude},${longitude}`;

  superagent.get(url)
    .then(data => {
      const dailyWeather = data.body.daily.data.map(day => {
        return new MapWeather(day);
      });
      response.status(200).send(dailyWeather);
    })
    .catch(() => {
      errorHandler('If you did not get result. Please, try again', request, response);
    });

});


app.get('/events', (request, response) => {
  let key = process.env.EVENTFUL_API_KEY;
  let {search_query }= request.query;
  const eventDataUrl =`http://api.eventful.com/json/events/search?keywords=music&location=${search_query}&app_key=${key}`;

  superagent.get(eventDataUrl)
    .then(eventData => {
      let eventMassData = JSON.parse(eventData.text);
      let localEvent = eventMassData.events.event.map(thisEventData => {
        return new NewEvent(thisEventData);
      });
      response.status(200).send(localEvent);
    })
    .catch(() => {
      errorHandler('If you did not get result. Please, try again', request, response);
    });

});


app.get('/movies', (request, response) => {

  let key = process.env.Movie_API_key;
  let {search_query }= request.query;
  const movieDataUrl =`https://api.themoviedb.org/3/search/movie?api_key=${key}&language=en-US&query=${search_query}`;

  superagent.get(movieDataUrl)
    .then(movieData => {
      let movieMassData = movieData.body.results;
      let localMovie = movieMassData.map(thisMovieData => {
        return new NewMovie(thisMovieData);
      });
      response.status(200).send(localMovie);
    })
    .catch(() => {
      errorHandler('If you did not get result. Please, try again', request, response);
    });

});


app.get('/yelp', (request, response) =>{
  let key = process.env.Yelp_API_key;
  let {latitude, longitude} = request.query;
  let yelpDataUrl = `https://api.yelp.com/v3/businesses/search?term=delis&latitude=${latitude}&longitude=${longitude}`;
  superagent
    .get(yelpDataUrl)
    .set('Authorization', `Bearer ${key}`)
    .then(yelpData => {
      let businessList = JSON.parse(yelpData.text).businesses;
      let business = businessList.map(thisYelpdata => {
        return new Yelp(thisYelpdata);
      });
      response.status(200).send(business);
    })
    .catch(() => {
      errorHandler('If you did not get result. Please, try again', request, response);
    });
});

// Define function



function Location(city, localData) {
  this.search_query = city;
  this.formatted_query = localData.display_name;
  this.latitude = localData.lat;
  this.longitude = localData.lon;
}



function MapWeather(dailyForecast) {
  this.forecast = dailyForecast.summary;
  this.time = new Date(dailyForecast.time *1000).toDateString();
}


function NewEvent(thisEventData) {
  this.name = thisEventData.title;
  this.event_date = thisEventData.start_time.slice(0,10);
  this.link = thisEventData.url;
  this.summary = thisEventData.description;

}

function NewMovie(thisMovieData) {
  this.title = thisMovieData.title;
  this.overview = thisMovieData.overview;
  this.average_votes = thisMovieData.average_votes;
  this.total_votes = thisMovieData.total_votes;
  this.image_url = `https://image.tmdb.org/t/p/w500${thisMovieData.backdrop_path}`;
  this.popularity = thisMovieData.popularity;
  this.released_on = thisMovieData.released_on;
}

function Yelp(thisYelpdata) {
  this.name = thisYelpdata.name;
  this.image_url = thisYelpdata.image_url;
  this.price = thisYelpdata.price;
  this.rating = thisYelpdata.rating;
  this.url = thisYelpdata.url;

}










function errorHandler(string, response) {
  response.status(500).send(string);
}

// Make sure the server is listening for requests
// app.listen(PORT, () => console.log(`Never Give up ${PORT}`));

// connect to BD and Start the web server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log('Never Give up', PORT);
    });
  })
  .catch(err => {
    throw `PG Startup Error: ${err.message}`;
  });

'use strict';

const express = require('express');
const app = express();
require('dotenv').config();

const cors = require('cors');

//  Declare variable
app.use(cors());
const PORT = process.env.PORT || 3001;

// use corss to allow to past data to front end

app.use(cors());


// define routes
app.get('/location', (request, response) => {
  response.send('Happy!');
  try {
    const dataArray = require('./data/geo.json');
    const geoData = dataArray [0];
    const city = request.query.city;

    let location = new Location (city, geoData);
    response.status(200).send(location);
  }
  catch(error) {
    errorHandler('If you did not get results. Please try again.', response);
  }
});

app.get('/weather', (request, response) => {

  try {
    const weatherData = require('./data/darksky.json');
    const dailyWeather = weatherData.daily.data.map(day => {
      return new MapWeather(day);
    });
    // let dailyArray =[];

    // dailyWeather.forEach(day => {
    //   dailyArray.push(new Weather(day));
    // });
    // response.status(200).send(dailyArray);
    response.status(200).send(dailyWeather);
  } catch(error) {
    errorHandler('If you did not get result. Please try again.', response);
  }
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
  this.time = new Date(dailyForecast.time).toDateString();
}

function errorHandler(string, response) {
  response.status(500).send(string);
}




// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Never Give up ${PORT}`));

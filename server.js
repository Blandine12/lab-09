'use strict';

require('dotenv').config();
const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());


const PORT = process.env.PORT || 3001;

app.get('/location', (request, response) => {
  response.send('Happy!');
});

//   let location = {
//     search_query: city,
//     formatted_query:geoData[0].display_name.
    
//     longitude = geoData[0].lon, 
//   }
//   response.status (200).send (l)
// });

function location(city, locationData){
  this.search_query = city;
  this.latitude = locationData.lat;
  this. longtitude = locationData.lon;
}






// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Never Give up ${PORT}`));

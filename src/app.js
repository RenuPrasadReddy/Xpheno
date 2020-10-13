const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose'); 
const axios = require('axios');
const cheerio = require('cheerio');
const {LinksAndCountModel} = require('./linksAndCount.model');
// const router = require('express').Router();


const app = express();
app.use(express.json())
dotenv.config();

app.listen(process.env.PORT, ()=> console.log("server listening to port ",process.env.PORT));

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
mongoose.connection.on('connected', ()=> console.log('connected to atlas db'));

app.post('/scrapData/', (req, res) => {
  console.log("in scrapData");

  let url = "https://medium.com";
  console.log({url})
  axios.get(url).then( resp => {
    let $ = cheerio.load(resp.data);
    let linksAndCountObj = {}, queryArr = [];
    // console.log("$=",$);

    $('a').each(function() {
      var text = $(this).text();
      var link = $(this).attr('href').split("---")[0].trim();
  
      if(link && link.includes('medium')){
        console.log(text + ' --> ' + link);

        // to get unique params
        let allParams = link.split('?')[1];
        // console.log(JSON.stringify(allParams));

        let params = allParams.split('&'); 
        // console.log("params = ",JSON.stringify(params));

        let uniqueParams = [];
        params.forEach( param => uniqueParams.push(param));
        // uniqueParams = uniqueParams.
        console.log("uniqueParams=", JSON.stringify(uniqueParams));

        // to store unique links and their counts
        if( linksAndCountObj.hasOwnProperty(link) ) {
          linksAndCountObj[link].count = linksAndCountObj[link].count + 1;
          linksAndCountObj[link].uniqueParams = uniqueParams
        }
        else {
          linksAndCountObj[link] = {count : 1};
          linksAndCountObj[link].uniqueParams = uniqueParams;
        }
      };
    });

    console.log({linksAndCountObj});

    // adding into array for bulk write
    let keys= Object.keys(linksAndCountObj);
    for(let key of keys) {
      queryArr.push({
        "updateOne": {
          "filter" : {
            url: key
          },
          update: {
            "$set": {
              url: key,
              count: linksAndCountObj[key].count,
              uniqueParams: linksAndCountObj[key].uniqueParams
            }
          },
          "upsert" : true
        }
      });
    }
    console.log(JSON.stringify(queryArr));
    
    if(queryArr.length > 0) {
      LinksAndCountModel.bulkWrite(queryArr, (error, result) => {
        if(error) {
          console.log("error in bulkwrite=", error);
        }
        else {
          console.log("bulkwrite=", result);
        }
        
      })
    }

  }) 

});

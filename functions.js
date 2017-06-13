'use strict';
const fetch = require('node-fetch');
const {CurrentArtist} = require('./models');
const base64 = require('base-64');

const baseUrl = `https://api.spotify.com/v1/`;

function getCredentials(){
  return fetch('https://accounts.spotify.com/api/token',{
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${base64.encode('f397ddf305dd4fb1a348e110c2d0f2ca:fd2e4d4c99494bdc9da125ea768078ba')}`
    }
  })
  .then(uglyStream=> uglyStream.json())
  .then(niceJson=> niceJson.access_token);
}

function bigImg(artist){
  let biggest = 0;
  let bigIndex = 0;
  let i = 0;
  artist.images.forEach(obj=>{
    if(obj.width > biggest){
      bigIndex = i;
      biggest= obj.width;
    }
    i++;
  });
  return bigIndex;
}

function sReqRelated (id, credentials){
  let relatedUrl = `${baseUrl}artists/${id}/related-artists`;
  return fetch(relatedUrl, {
    method: 'get',
    headers: {
      authorization: `Bearer ${credentials}`
    }});
}

function sReqBySearch(baseUrl,type,query,clientRespond, credentials){
  const searchUrl = `${baseUrl}search?type=${type}&q=${query}`;

  return fetch(searchUrl,{
    method: 'get',
    headers: {
      authorization: `Bearer ${credentials}`
    }
  })
  // .header('authorization','Bearer BQBCLP5TS6G33wjIn60CXZlMJNCj_BGDFyzFEFLrcZILGRbqhMb64oxXU9fO1ZCWkg21DjuIdDKj8sEzFf5t4Q')
  .then(response => {
    return response.json();
  })
  .then(res=>{
    let responseArtist = res.artists.items[0];

    // console.log(responseArtist);

    CurrentArtist.name = responseArtist.name;
    CurrentArtist.id = responseArtist.id;
    CurrentArtist.imageUrl = responseArtist.images[bigImg(responseArtist)].url;
    CurrentArtist.genres = responseArtist.genres;
    CurrentArtist.related = [];

    return sReqRelated(CurrentArtist.id, credentials);
  })
  .then(res=>{
    return res.json();
  })
  .then(res=>{
    res.artists.forEach(obj=>{
      let relatedArtist = {
        name: obj.name,
        id: obj.id,
        genres:obj.genres,
        tags:[],
        imageUrl:obj.images[bigImg(obj)].url
      };
      CurrentArtist.related.push(relatedArtist);
    });
    clientRespond.json(CurrentArtist);
    console.info('sent current artist json to client');
  })
  .catch(err => console.error(err.message));
}

module.exports = {getCredentials, bigImg, sReqRelated, sReqBySearch};
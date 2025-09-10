$.ajax({
    url: "https://raw.githubusercontent.com/bwstays/bwstays/refs/heads/main/data/sitedata.js",
    dataType: "json"
}).done(function(result){
  alert( result.siteData) ;
  console.log(result[0][0]);
});
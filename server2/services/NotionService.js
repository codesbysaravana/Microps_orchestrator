const { notion } = require("../utils/notionClient");

async function connectNotion(notionToken, notionDB) {
    const test = await notion.search();
    //console.log(test);
    //console.log(typeof test); 
    //console.log(test.results[3].object);
    let responseDataBases= [];
    const resArr = test.results;
    for(let i=0; i<resArr.length; i++) {
        if(resArr[i].object === "data_source") {
            /* test.results[i].title.map((name) => {
                console.log(name);
            }) */
            console.log(test.results[i].properties);
            console.log(test.results[i].id);
            console.log(test.results[i].title[0].plain_text);
            //console.log(test.results[i].properties);
            
            responseDataBases.push({
                id: test.results[i].id,
                properties: test.results[i].properties,
                title: test.results[i].title[0].plain_text
            });
        }
    }

    console.log(responseDataBases);
    return responseDataBases;
}

module.exports = { connectNotion };

//remember without {} at imports itll be { notion : clientInstance } not clientInstance alone

//flow must be 1)search results -> 2)filter -> 3)get data_source -> 4) show the names -> 5)let user choose
//flow done search fetches and put a loop for finding datastore within array and inside found title name of the datasource
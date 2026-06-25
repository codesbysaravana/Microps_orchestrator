/* require('dotenv').config({
    path: '../.env'
}); */
require('dotenv').config();
const { Client } = require('@notionhq/client');

console.log("TOKEN:", process.env.NOTION_TOKEN);
const NOTION_TOKEN = process.env.NOTION_TOKEN;

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

module.exports = { notion };

/* async function test() {
    const result = await notion.search();
    console.log(result);
} */
//test();
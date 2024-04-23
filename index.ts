const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());

const { executablePath } = require("puppeteer");
// login page for cbs fantasy football
const url =
  "https://www.cbssports.com/user/login/?redirectUrl=https%3A%2F%2Fwww.cbssports.com%2Ffantasy%2Ffootball%2F";

const CBS_League_Settings = async () => {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    executablePath: executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // enter login credentials and click login
  await page.type(
    "xpath/html/body/div[2]/div[4]/div/main/div/div[1]/form/div[1]/input",
    "username",
    { delay: 50 }
  );
  await page.type(
    "xpath/html/body/div[2]/div[4]/div/main/div/div[1]/form/div[2]/input",
    "password123123123123"
  );
  // click login button after entering credentials
  await page.click("#app_login > div:nth-child(10) > button");
  // await browser.close();
};

CBS_League_Settings();

// scrape code from chrome extension

//Content script for reading league settings from CBS Rules page
// var site = "CBS";
// var siteid = window.location.host.split(".")[0];
// var siteContent = {
//     "site": site, "siteid": siteid, "type": "settings",
//     "settings": {
//         "map": {},
//         "mapped": {},
//         "includes": { "rules": true },
//         "siteneeds": { "rules": true, "teams": true, "draftorder": true, "myteam": true }
//     },
//     "status": false
// };
// var map = {};
// var mapped = {};

// window.onload = function () {
//     setTimeout(update, 3000);
// };

// function update() {
//     //read html content
//     readContent().then(function (result) {
//         if (result === 'success') {
//             //save to chrome storage sync
//             save();
//         }
//     }, function (reject) {//error
//         console.log(reject);
//     });
// }
// function readContent() {
//     return new Promise(function (resolve, reject) {
//         var elements = document.getElementsByClassName('featureComponentContainer');
//         if (elements !== undefined && elements.length > 0) {
//             readSection(elements).then(function (result) {
//                 if (result === 'success') {
//                     siteContent.settings.map = map;
//                     siteContent.settings.mapped = mapped;
//                     siteContent.status = true;
//                     resolve('success');
//                 }
//             });
//         } else {
//             setTimeout(update, 500);
//         }
//     });
// }
// function readSection(elements) {
//     var element = null;
//     return new Promise(function (resolve, reject) {
//         var sections = ['LEAGUE IDENTITY', 'ROSTER LIMITS', 'SCORING SYSTEM', 'DRAFT SETTINGS'];
//         for (var i = 0; i < elements.length; i++) {
//             element = elements[i].getElementsByClassName('leftUnderline')[0];
//             if (sections.includes(element.innerText)) {
//                 var fields = [], category = '';
//                 var rows = elements[i].getElementsByTagName('tr');
//                 //loop through rows of settings
//                 for (var j = 0; j < rows.length; j++) {
//                     if (JSON.stringify(map).length > 7000) break;
//                     element = rows[j];
//                     if (element.className !== 'label' && element.className !== 'subtitle') {
//                         var rule = element.children[0].innerText;
//                         switch (element.children.length) {
//                             case 2:
//                                 map[category + '|' + rule] = element.children[1].innerText == Number(element.children[1].innerText) ? Number(element.children[1].innerText) : element.children[1].innerText;
//                                 break;
//                             case 3:
//                                 switch (rule) {
//                                     case 'FG':
//                                         var arr = element.children[2].innerText.split('\n');
//                                         map[category + '|Field Goals (FG)'] = Number(arr[0].replace(' points', '').replace(' point', ''));
//                                         if (arr.length > 1) {
//                                             var range = '';
//                                             for (var a = 1; a < arr.length; a++) {//bonus ranges
//                                                 if (arr[a].indexOf('for a FG') > -1) {
//                                                     range = arr[a].substring(arr[a].indexOf('for a FG') + 6);
//                                                     points = arr[a].split(' ')[1].replace(' points', '').replace(' point', '');
//                                                     map[category + '|' + range + ' (FG)'] = Number(points);
//                                                 }
//                                             }
//                                         }
//                                         break;
//                                     case 'PaYd':
//                                     case 'RuYd':
//                                     case 'ReYd':
//                                         arr = element.children[2].innerText.split(' ');
//                                         if (arr.length === 9) {
//                                             if (Number(element.children[2].innerText.split(' ')[7]) > 0) {
//                                                 points = Number(element.children[2].innerText.split(' ')[3]) / Number(element.children[2].innerText.split(' ')[7])
//                                             } else {
//                                                 points = Number(element.children[2].innerText.split(' ')[3])
//                                             }
//                                         } else {
//                                             points = element.children[0].innerText === 'PAYD' ? 0.10 : 0.04;
//                                         }
//                                         map[category + '|' + element.children[1].innerText + ' (' + rule + ')'] = Number(points);
//                                         break;
//                                     case 'PaTD':
//                                     case 'RuTD':
//                                     case 'ReTD':
//                                         arr = element.children[2].innerText.split('\n');
//                                         if (arr.length > 1) {
//                                             points = arr[0].replace(' points', '').replace(' point', '');
//                                             map[category + '|' + element.children[1].innerText + ' (' + rule + ')'] = Number(points);
//                                             //bonus ranges
//                                             var average = 0, rangeCount = 1;
//                                             for (var range = 1; range < arr.length; range++) {
//                                                 if (arr[range].split(' ').length > 2) {
//                                                     points = arr[range].split(' ')[1];
//                                                     average += Number(points) / rangeCount;
//                                                     rangeCount++;
//                                                 }
//                                             }
//                                             if (arr.length > 1) {
//                                                 map[category + '|' + element.children[1].innerText + ' (' + rule + '50)'] = average;
//                                             }
//                                         } else {
//                                             points = element.children[2].innerText.replace(' points', '').replace(' point', '');
//                                             map[category + '|' + element.children[1].innerText.replace(/[&\/\\#+$~%'"*?<>{}]/g, '_') + ' (' + rule + ')'] = Number(points);
//                                         }
//                                         break;
//                                     case 'PA':
//                                     case 'YDS':
//                                         arr = element.children[2].innerText.split('\n');
//                                         range = '';
//                                         for (var a = 0; a < arr.length; a++) {//ranges
//                                             if (arr[a].indexOf(' = ') > -1) {
//                                                 range = rule + '|' + arr[a].split(' = ')[0];
//                                                 points = arr[a].split(' = ')[1].replace(' points', '').replace(' point','');
//                                                 map[category + '|' + range + ' (' + rule + ')'] = Number(points);
//                                             }
//                                         }
//                                         break;
//                                     default:
//                                         points = element.children[2].innerText.replace(' points', '').replace(' point', '');
//                                         map[category + '|' + element.children[1].innerText.replace(/[&\/\\#+$~%'"*?<>{}]/g, '_') + ' (' + rule + ')'] = Number(points);
//                                         break;
//                                 }
//                                 break;
//                             case 4://rosters
//                                 for (var k = 1; k < element.children.length; k++) {
//                                     if (fields[k] !== '') {
//                                         map[category + '|' + rule + '|' + fields[k]] = Number(element.children[k].innerText);
//                                     }
//                                 }
//                                 break;

//                         }
//                     } else {
//                         //field headers
//                         fields = [];
//                         for (k = 0; k < element.children.length; k++) {
//                             fields.push(element.children[k].innerText);
//                         }
//                         category = fields[0];
//                     }
//                 }
//             }
//         }
//         //other settings for CBS
//         mapped["General.Abbrev"] = map["DESCRIPTION|League E-mail Address"].split("@")[0].substring(0, 8).toUpperCase();
//         mapped["Rosters.Pos.BE.Bench"] = map["STATUS|Bench|MAX"];
//         resolve('success');
//     });
// }
// function save() {
//     //save to chrome storage sync
//     chrome.storage.sync.set({ "siteContent": siteContent }, function () {
//         console.log(siteContent);
//     });
// }
// //listen to changes to storage sync
// chrome.storage.onChanged.addListener(function (changes, namespace) {
//     console.log(changes);
//     if (changes.import && changes.import.newValue) {
//         var obj = changes.import.newValue;
//         if (obj.site === site && obj.siteid === siteid && obj.sync === "settings") {
//             console.log('call update');
//             console.log(changes);
//             update();
//         }
//     }
// });

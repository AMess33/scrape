const puppeteer = require("puppeteer");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
const inputDate = dayjs().format("YYYY-MM-DD");
const twoWeeks = dayjs().subtract(2, "weeks").format("YYYY-MM-DD");
const pastMonth = dayjs().subtract(1, "months").format("YYYY-MM-DD");

const url = "https://nfc.shgn.com/adp/football";

let draft_types = [
  {
    lable: "Primetime",
    value: "447",
  },
  {
    lable: "Rotowire",
    value: "446",
  },
  {
    lable: "NFFC BestBall Overall",
    value: "444",
  },
  {
    lable: "Classic",
    value: "442",
  },
  {
    lable: "Guillotine",
    value: "455",
  },
  {
    lable: "Superflex",
    value: "469",
  },
];

const GET_NFFC_ADP = async (draft_type: { lable: string; value: string }) => {
  const browser: Browser = await puppeteer.launch({});
  const page = await browser.newPage();
  await page.goto(url);

  // inject date range values

  // select draft type drop down menu, then draft type desired
  await page.select("select#draft_type", draft_type.value);
  await page.waitForSelector("td:nth-child(2) > a", { timeout: 10000 });

  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll("#adp > tbody > tr")
    );
    // map each row in the table
    const data = playerRows.map((player: any) => ({
      rank: player.querySelector(".rank").innerText,
      playerName: player.querySelector("td:nth-child(2) > a").innerText,
      position: player.querySelector("td:nth-child(4)").innerText.trim(),
      team: player.querySelector("td:nth-child(3)").innerText.trim(),
      adp: player.querySelector("td:nth-child(5)").innerText,
    }));
    return data;
  });
  fs.writeFileSync(
    `${draft_type.lable}.json`,
    JSON.stringify(adpData),
    (err: any) => {
      if (err) throw err;
      console.log("The file has been saved!");
    }
  );
  console.log(adpData);
  await browser.close();
};

draft_types.forEach((draft_type) => {
  GET_NFFC_ADP(draft_type);
});

// create array of selectors to pass in for each evaluate X
// save each with selector title and current date

// save date ranges in variables with day js
// inject day js values into to date and from dates
// submit button press X
// wait for page load then evaluate X

// current day = dayjs(0.format('YYYY-MM-DD'))
// 2weeks = dayjs.fortnights(2).format('YYYY-MM-DD')

// #from_date #to_date

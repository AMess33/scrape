// working as intended. double check once other draft types have adp data to scrape

const puppeteer = require("puppeteer");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
const inputDate = dayjs().format("MM-DD-YYYY");
const twoWeeks = dayjs().subtract(2, "weeks").format("MM-DD-YYYY");
const pastMonth = dayjs().subtract(1, "months").format("MM-DD-YYYY");

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
  const browser: Browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);

  // inject date range values
  // await page.type("#from_date", pastMonth);
  await page.type("#from_date", twoWeeks);
  await page.type("#to_date", inputDate);

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
    `${draft_type.lable} ${currentDate}.json`,
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
// save each with selector title and current date X

// save date ranges in variables with day js X
// inject day js values into to date and from dates X
// submit button press X
// wait for page load then evaluate X

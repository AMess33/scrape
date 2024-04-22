const puppeteer = require("puppeteer");
const fs = require("fs");
import { Browser } from "puppeteer";
const dayjs = require("dayjs");

const currentDate = dayjs().format("MM-DD-YYYY");
const url = "https://www.rotowire.com/football/adp.php";

const ESPN_ADP = async () => {
  const browser: Browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const adpData = await page.evaluate(() => {
    const playerRows = Array.from(
      document.querySelectorAll("#datatable1713742697875 > div.webix_ss_body")
    );
    // map each row in the table
    const data = playerRows.map((player: any) => ({
      // playername data saved as playername
      playerName: player.querySelector(
        "div.webix_column.align-l.webix_last > div:nth-child(1) > a"
      ).innerText,
      // player position data saved as position
      position: player
        .querySelector(
          "#datatable1713742697875 > div.webix_ss_body > div.webix_ss_center > div > div:nth-child(2) > div:nth-child(1)"
        )
        .innerText.trim(),
      // player team data saved as team
      team: player
        .querySelector(
          "#datatable1713742697875 > div.webix_ss_body > div.webix_ss_center > div > div.webix_column.colgroup-edge.webix_first > div:nth-child(1) "
        )
        .innerText.trim(),
      // player adp data saved as adp
      adp: player.querySelector(
        "#datatable1713742697875 > div.webix_ss_body > div.webix_ss_center > div > div:nth-child(5) > div:nth-child(1)"
      ).innerText,
      auctionValue: player.querySelector(
        "#datatable1713742697875 > div.webix_ss_body > div.webix_ss_center > div > div:nth-child(5) > div:nth-child(1)"
      ),
    }));
    return data;
  });

  console.log(adpData);
  await browser.close();

  fs.writeFileSync(
    `espn ${currentDate}.json`,
    JSON.stringify(adpData),
    (err: any) => {
      if (err) throw err;
      console.log("The file has been saved!");
    }
  );
};

ESPN_ADP();

process.on('unhandledRejection', (reason, promise) => {
  console.error(reason);
});
import * as express from "express";
import * as bodyParser from "body-parser";
import { post, get } from "request";
import { posix, resolve } from "path";
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { ensureDirSync } from "fs-extra";
import { createHmac } from "crypto";
const configRawObject = JSON.parse(readFileSync("./config.json").toString("utf-8"));
const config = {
  "port": Number(configRawObject.port),
  "commandExpressPrefixUrl": configRawObject.commandExpressPrefixUrl,
  "consumerKey": configRawObject.consumerKey,
  "consumerSecret": configRawObject.consumerSecret,
  "accessToken": configRawObject.accessToken,
  "accessTokenSecret": configRawObject.accessTokenSecret,
  "devLabel": configRawObject.devLabel,
  "webhookUrl": configRawObject.webhookUrl,
  "webhookExpressPrefixUrl": configRawObject.webhookExpressPrefixUrl,
  "logDir": configRawObject.logDir
};
ensureDirSync(config.logDir);
class Main {
  constructor() {
    const commandUrlPrefix: string = "/cmd/";
    const app: express.Application = express();
    app.disable('x-powered-by');
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.get(`${posix.join(config.webhookExpressPrefixUrl, "/")}`, (request: express.Request, response: express.Response) => {
      const crc_token = request.query.crc_token;
      if (crc_token) {
        const hash = createHmac('sha256', config.consumerSecret).update(crc_token).digest('base64');
        log(`crc_token確認。token=${crc_token} responce=${hash}`);
        response.status(200);
        response.send({ response_token: 'sha256=' + hash }).end();
      } else {
        response.status(400).end();
      }
    });
    app.post(`${posix.join(config.webhookExpressPrefixUrl, "/")}`, (request: express.Request, response: express.Response) => {
      log(`${JSON.stringify(request.body, null, "")}`);
      response.send('200 OK');
    });
    const cmdが有効か = false;
    if (cmdが有効か) {
      app.get(`${posix.join(commandUrlPrefix, "/")}`, (request: express.Request, response: express.Response) => {
        response.status(200).send(コマンド一覧のhtmlを返す()).end();
      });
      app.get(`${posix.join(commandUrlPrefix, "/regist")}`, async (request: express.Request, response: express.Response) => {
        await 登録();
        response.status(200).send(コマンド一覧のhtmlを返す()).end();
      });
      app.get(`${posix.join(commandUrlPrefix, "/list")}`, async (request: express.Request, response: express.Response) => {
        const list = await 一覧();
        response.status(200).send(コマンド一覧のhtmlを返す() + `<pre>${list}</pre>`).end();
      });
    }
    app.listen(config.port, () => {
      console.log(`http://localhost:${config.port}${config.webhookExpressPrefixUrl}`);
    });
  }
}
new Main();
async function 登録() {
  await new Promise(resolve => {
    const request_options = {
      url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/webhooks.json`,
      oauth: {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
        token: config.accessToken,
        token_secret: config.accessTokenSecret,
      },
      headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      form: { url: config.webhookUrl }
    };
    post(request_options, (error, response, body) => {
      log(`cli-post-webhooks : ${JSON.stringify(JSON.parse(body), null, "")}`);
      resolve();
    });
  });
  await new Promise(resolve => {
    const request_options = {
      url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/subscriptions.json`,
      oauth: {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
        token: config.accessToken,
        token_secret: config.accessTokenSecret,
      }
    };
    post(request_options, (error, response, body) => {
      log(`cli-post-subscriptions : ${body == "" ? "body none" : JSON.stringify(JSON.parse(body), null, "")}`);
      resolve();
    });
  });
  await new Promise(resolve => {
    const request_options = {
      url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/webhooks.json`,
      oauth: {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
        token: config.accessToken,
        token_secret: config.accessTokenSecret,
      },
      headers: { 'Content-type': 'application/x-www-form-urlencoded' }
    };
    get(request_options, (error, response, body) => {
      log(`cli-get-webhooks : ${JSON.stringify(JSON.parse(body), null, "")}`);
      resolve();
    });
  });
};
async function 一覧(): Promise<string> {
  return await new Promise<string>(resolve => {
    const request_options = {
      url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/webhooks.json`,
      oauth: {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
        token: config.accessToken,
        token_secret: config.accessTokenSecret,
      },
      headers: { 'Content-type': 'application/x-www-form-urlencoded' }
    };
    get(request_options, (error, response, body) => {
      resolve(JSON.stringify(JSON.parse(body), null, "  "));
    });
  });
};
function コマンド一覧のhtmlを返す(): string {
  const result: string[] = [];
  result.push(`
  <!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<style>
 *{word-break: break-all;box-sizing: border-box;}
</style>`);
  result.push(`<ul>`);
  result.push(`<li><a href="./regist">登録</a></li>`);
  result.push(`<li><a href="./list">一覧表示</a></li>`);
  result.push(`</ul>`);
  return result.join("");
}
function log(message: string) {
  const logFilePath = posix.join(config.logDir, `log.txt`);
  let timeStamp = "";
  {
    let d = new Date();
    let r = "";
    r += String(d.getFullYear());
    r += "-";
    r += String(d.getMonth() + 1).padStart(2, "0");
    r += "-";
    r += String(d.getDate()).padStart(2, "0");
    r += "(";
    r += ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    r += ")";
    r += String(d.getHours()).padStart(2, "0");
    r += "-";
    r += String(d.getMinutes()).padStart(2, "0");
    r += "-";
    r += String(d.getSeconds()).padStart(2, "0");
    r += ".";
    r += String(d.getMilliseconds()).padStart(3, "0");
    timeStamp = r;
  }
  console.log(message);
  appendFileSync(logFilePath, `${timeStamp} ${message}\n`);
}
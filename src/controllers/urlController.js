const shortid = require("shortid");
const urlModel = require("../models/urlModel");
const { promisify } = require("util");
const redis = require("redis");
//Connect to redis
const redisClient = redis.createClient(
    13190,
    "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis...");
  });
  
  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValidRequest = (value) => {
  if (typeof value == "undefined" || value === null) return false;
  if (typeof value != "string" || value.trim().length == 0) return false;
  return true;
};

const urlShorten = async (req, res) => {
  try {
    if (Object.keys(req.body).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid input in body" });

    let { longUrl } = req.body;

    //validate url
    if (!longUrl)
      return res
        .status(400)
        .send({ status: false, message: "Please enter longUrl" });

    if (!isValidRequest(longUrl))
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid longUrl" });

    if (
      !/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})?$/.test(
        longUrl
      )
    )
      return res
        .status(400)
        .send({ status: false, message: `'${longUrl}' is not a valid URL` });

    let checkLongUrl = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ _id: 0, longUrl: 1, urlCode: 1, shortUrl: 1 });
    if (checkLongUrl)
      return res.status(200).send({ status: true, data: checkLongUrl });

    //creating urlCode
    let short = shortid.generate().toLowerCase();

    //checking if urlCode is unique
    while (await urlModel.findOne({ urlCode: short })) {
      console.log(short);
      short = shortid.generate().toLowerCase();
    }

    req.body.urlCode = short;
    req.body.shortUrl = "http://localhost:3000/" + short;

    let savedData = await urlModel.create(req.body);

    let data = {
      urlCode: savedData.urlCode,
      longUrl: savedData.longUrl,
      shortUrl: savedData.shortUrl,
    };

    res.status(201).send({ status: true, data: data });
  } catch (err) {
    res.status(500).send({ sattus: false, message: err.message });
  }
};

const getUrl = async (req, res) => {
  try {
    let { urlCode } = req.params;

    if (Object.keys(req.body).length > 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter urlCode in params" });

    if (!shortid.isValid(urlCode))
      return res.status(400).send({
        status: false,
        message: "Please enter a valid urlCode",
      });

    let cahcedData = await GET_ASYNC(`${urlCode}`)
      if(cahcedData) {
       return res.send(cahcedData)
    } 
    

    let checkUrl = await urlModel.findOne({
      urlCode: urlCode.toLowerCase().trim(),
    });
    if (!checkUrl)
      return res.status(404).send({ status: false, message: "URL not found" });
    await SET_ASYNC(`${urlCode}`, `Found. Redirecting to ${checkUrl.longUrl}`)
    res.status(302).redirect(checkUrl.longUrl);
  } catch (err) {
    res.status(500).send({ sattus: false, message: err.message });
  }
};

module.exports = { urlShorten, getUrl };

const shortid = require("shortid");
const urlModel = require("../models/urlModel");
const { promisify } = require("util");
const redis = require("redis");

//Connecting to redis
const redisClient = redis.createClient(
  14674,
  "redis-14674.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("L0heTOscTdBVNsqnedJYGXuP83MEXWHx", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis...");
});

//Promisifying and setting redis function
const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//Request validation
const isValidRequest = (value) => {
  if (typeof value == "undefined" || value === null) return false;
  if (typeof value != "string" || value.trim().length == 0) return false;
  return true;
};

///////////////////////////////////////////////////////CREATE SHORT URL API//////////////////////////////////////////////////////////////

const urlShorten = async (req, res) => {
  try {
    //Validating request body
    if (Object.keys(req.body).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid input in body" });

    let { longUrl } = req.body;

    //validating longUrl
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

    //Checking if long URL is already present in our DB
    let checkLongUrl = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, longUrl: 1, urlCode: 1, shortUrl: 1 });
    if (checkLongUrl)
      return res.status(200).send({ status: true, data: checkLongUrl });

    //creating urlCode
    let short = shortid.generate().toLowerCase();

    //checking if urlCode is unique
    while (await urlModel.findOne({ urlCode: short })) {
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

///////////////////////////////////////////////////////GET URL API//////////////////////////////////////////////////////////////

const getUrl = async (req, res) => {
  try {
    let { urlCode } = req.params;

    //urlCode shound be entered in params only not in body
    if (Object.keys(req.body).length > 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter urlCode in params" });

    //Validating urlCode
    if (!shortid.isValid(urlCode))
      return res.status(400).send({
        status: false,
        message: "Please enter a valid urlCode",
      });
    
    //Checking if data is present in cache,and sending response if present
    let cachedData = await GET_ASYNC(`${urlCode}`);
    if (cachedData) {
      return res.status(302).send(cachedData);
    }

    //If not present in cache fetching data from DB and storing it in cache
    let checkUrl = await urlModel.findOne({
      urlCode: urlCode.toLowerCase().trim(),
    });
    
    if (!checkUrl)
      return res.status(404).send({ status: false, message: "URL not found" });
    
    await SET_ASYNC(`${urlCode}`,60, `Found. Redirecting to ${checkUrl.longUrl}`);
    console.log("db call")
    res.status(302).redirect(checkUrl.longUrl);

  } catch (err) {

    res.status(500).send({ sattus: false, message: err.message });
  }
};

module.exports = { urlShorten, getUrl };

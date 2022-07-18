const { response } = require("express");
const shortid = require("shortid");
const validator = require("validator");
const urlModel = require("../models/urlModel");

const urlShorten = async (req, res) => {
  try {
    let longUrl = req.body.longUrl.trim();

    if (Object.keys(req.body).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid input in body" });

    //validate url
    if (!longUrl)
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid longUrl" });
    //if (!validator.isURL(longUrl))
    if (
      !/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(
        longUrl
      )
    )
      return res
        .status(400)
        .send({ status: false, message: `'${longUrl}' is not a valid URL` });

    //creating urlCode
    let short = shortid.generate();
    console.log(short);

    //checking if urlCode is unique and has only lower case letters
    // while (
    //   !/^[a-z]+$/.test(short) ||
    //   (await urlModel.findOne({ urlCode: short }))
    // ) {
    //  // console.log(short);
    //   short = shortid.generate().toLowerCase();
    // }

    req.body.urlCode = short;
    req.body.shortUrl = "http://localhost:3000/" + short;

    let savedData = await urlModel.create(req.body);

    let data = {
      longUrl: savedData.longUrl,
      shortUrl: savedData.shortUrl,
      urlCode: savedData.urlCode,
    };

    res.status(201).send({ status: true, data: data });
  } catch (err) {
    res.status(500).send({ sattus: false, message: err.message });
  }
};

const getUrl = async (req, res) => {
  try {
    let { urlCode } = req.params;

    if (!urlCode || Object.keys(req.body).length > 0)
      return res
        .status(400)
        .send({ status: false, message: "Please enter urlCode in params" });

    if (!/^[a-z]+$/.test(urlCode))
      return res.status(400).send({
        status: false,
        message: "Please enter urlCode in lowerCase only",
      });

    let checkUrl = await urlModel.findOne({ urlCode: urlCode });
    if (!checkUrl)
      return res.status(404).send({ status: false, message: "URL not found" });
    // res.redirect(checkUrl.longUrl)
    res.status(302).send(`URL found. Redirecting to ${checkUrl.longUrl}`);
  } catch (err) {
    res.status(500).send({ sattus: false, message: err.message });
  }
};

module.exports = { urlShorten, getUrl };

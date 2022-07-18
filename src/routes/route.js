const express = require("express");
const { urlShorten, getUrl } = require("../controllers/urlController");
const router = express.Router();

// URL APIs
router.post("/url/shorten", urlShorten);
router.get("/:urlCode", getUrl);

router.all("/**", (req, res) => {
  res.status(400).send({ status: false, message: "Invalid request" });
});

module.exports = router;

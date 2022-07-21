const express = require("express");
const { urlShorten, getUrl } = require("../controllers/urlController");
const router = express.Router();

// URL APIs
router.post("/url/shorten", urlShorten);
router.get("/:urlCode", getUrl);

router.all("/**", (req, res) => {
  res.status(404).send({ status: false, message: "Page not found" });
});

module.exports = router;

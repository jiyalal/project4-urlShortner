const { promisify } = require("util");
const redis = require("redis");

//Connect to redis
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
  
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);

module.exports={SET_ASYNC,GET_ASYNC,SETEX_ASYNC}
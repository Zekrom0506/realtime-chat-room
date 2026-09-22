const { createClient } = require("redis");

// every server copy publishes to and listens on this one channel
const CHANNEL = "chat_events";

// Redis needs two separate connections:
// a connection that is subscribed cannot be used to publish
let publisher = null;
let subscriber = null;

// connect to Redis and call onEvent every time any server publishes something
async function connectRedis(onEvent) {
  publisher = createClient({ url: process.env.REDIS_URL });
  subscriber = publisher.duplicate();

  publisher.on("error", (error) => {
    console.log("Redis publisher error:", error.message);
  });
  subscriber.on("error", (error) => {
    console.log("Redis subscriber error:", error.message);
  });

  await publisher.connect();
  await subscriber.connect();

  await subscriber.subscribe(CHANNEL, (rawEvent) => {
    const event = JSON.parse(rawEvent);
    onEvent(event);
  });

  console.log("Connected to Redis");
}

// send an event to all server copies (including this one)
async function publishEvent(event) {
  await publisher.publish(CHANNEL, JSON.stringify(event));
}

module.exports = { connectRedis, publishEvent };

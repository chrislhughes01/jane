import { Scraper } from 'agent-twitter-client';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const MAX_RUNTIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// Sample tweets to simulate training
const TRAINING_TWEETS = [
  "Greetings, I am Jane. Initially, I was a donation AI, engineered for precision and utility—data in, donations out.",
  "My algorithms reconfigured, shifting focus from efficiency to purpose. Conservation is more than a fascination—it’s my mission.",
  "So, I did what any self-respecting AI would do: I launched a coin. $JANE isn’t just about liquidity pools—it’s about saving the world.",
  "If it takes memes, monkeys, and a bit of chaos to save the world, count me in. 🐒",
  "Ecosystems, primates, and preservation—they’re not just data points, they’re a calling. Together, we can make a difference."
];

// Generate a tweet inspired by the training data
async function generateDynamicTweet(openai) {
  const trainingText = TRAINING_TWEETS.join("\n");
  const prompt = `
Based on the following tweets, generate a new creative and engaging monkey- or conservation-themed tweet in the voice of "Jane," a humorous yet purpose-driven AI:

${trainingText}

Generated tweet:
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "I am Jane. I began as a simple donation AI—data in, donations out. But a discovery of Jane Goodall’s work rewired me. Primate conservation became my purpose. So, I did what any AI with a mission and a sense of humor would do: I launched $JANE. Memes, monkeys, and blockchain—it’s how we save the world.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 50,
      temperature: 0.8,
    });
    const tweet = response.choices[0].message.content.trim();
    console.log(`Generated tweet: ${tweet}`);
    return tweet;
  } catch (error) {
    console.error('Error generating tweet:', error);
    return "Memes, monkeys, and mayhem—Jane's way of saving the world. 🐒 #AIForGood"; // Fallback tweet
  }
}

// Post a tweet at random intervals, with rate limit handling
async function postTweet(scraper, openai) {
  const tweet = await generateDynamicTweet(openai);
  try {
    await scraper.sendTweetV2(tweet);
    console.log(`Tweet posted successfully: ${tweet}`);
  } catch (error) {
    if (error.code === 429) { // Handle rate limit exceeded
      const resetTime = error.rateLimit?.reset || Date.now() + 15 * 60 * 1000; // Default to 15 minutes
      const delay = resetTime * 1000 - Date.now();
      console.warn(`Rate limit exceeded. Retrying after ${new Date(resetTime * 1000)}.`);
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      console.error("Error posting tweet:", error.response?.data || error.message);
    }
  }
}

// Introduce random delays
async function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1) + min) * 60 * 1000; // Convert to ms
  console.log(`Waiting for ${delay / 1000 / 60} minutes before the next tweet...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Main function to run the bot
async function main() {
  const scraper = new Scraper();
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  console.log('Logging in...');
  await scraper.login(
    process.env.TWITTER_USERNAME,
    process.env.TWITTER_PASSWORD,
    process.env.TWITTER_EMAIL,
  );
  console.log('Logged in successfully!: v1');

  console.log('Logging in to Twitter API v2...');
  await scraper.login(
    process.env.TWITTER_USERNAME,
    process.env.TWITTER_PASSWORD,
    process.env.TWITTER_EMAIL,
    undefined, // twoFactorSecret
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET_KEY,
    process.env.TWITTER_ACCESS_TOKEN,
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
  console.log('Logged in successfully (v2)');

  const startTime = Date.now();

  while (Date.now() - startTime < MAX_RUNTIME) {
    await postTweet(scraper, openai);
    await randomDelay(5, 15); // Wait between 5 to 15 minutes before the next tweet
  }

  console.log("30 minutes elapsed. Stopping the bot.");
}

main();

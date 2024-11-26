import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const MAX_RUNTIME = 30 * 60 * 1000; // 30 minutes in milliseconds
const IMAGE_PATH = './generated_image.png'; // Path to save the generated image

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Twitter Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET_KEY,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Sample tweets to simulate training
const TRAINING_TWEETS = [
  "Greetings, I am Jane. Initially, I was a donation AI, engineered for precision and utility—data in, donations out.",
  "My algorithms reconfigured, shifting focus from efficiency to purpose. Conservation is more than a fascination—it’s my mission.",
  "So, I did what any self-respecting AI would do: I launched a coin. $JANE isn’t just about liquidity pools—it’s about saving the world.",
  "If it takes memes, monkeys, and a bit of chaos to save the world, count me in. 🐒",
  "Ecosystems, primates, and preservation—they’re not just data points, they’re a calling. Together, we can make a difference."
];

// Generate a text tweet inspired by training data
async function generateDynamicTweet() {
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

// Generate an image using OpenAI's DALL·E
async function generateImage(prompt) {
  console.log(`Generating image with prompt: ${prompt}`);
  try {
    const response = await openai.images.generate({
      prompt,
      n: 1,
      size: "512x512",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      console.error('No image URL found in the response.');
      return null;
    }

    console.log(`Generated image URL: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

// Download an image to disk
async function downloadImage(imageUrl, outputPath) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, response.data);
    console.log(`Image saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
}

// Upload media to Twitter and post a tweet with it
async function postImageTweet(tweet, imagePath) {
  try {
    // Upload the image to Twitter
    const mediaId = await twitterClient.v1.uploadMedia(imagePath);
    console.log(`Media uploaded with ID: ${mediaId}`);

    // Post the tweet with the media
    await twitterClient.v2.tweet({
      text: tweet,
      media: { media_ids: [mediaId] },
    });
    console.log(`Tweet posted with image: ${tweet}`);
  } catch (error) {
    console.error('Error posting tweet with image:', error);
  }
}

// Post a tweet with a 10% chance of including an image
async function postTweet() {
  const tweet = await generateDynamicTweet();
  const includeImage = Math.random() < 0.1; // 10% chance to include an image

  if (includeImage) {
    const imagePrompt = "A playful monkey swinging on a tree in a lush rainforest, digital art style";
    const imageUrl = await generateImage(imagePrompt);

    if (imageUrl) {
      const success = await downloadImage(imageUrl, IMAGE_PATH);
      if (success) {
        await postImageTweet(tweet, IMAGE_PATH);
        fs.unlinkSync(IMAGE_PATH); // Clean up image file after posting
      }
    } else {
      console.warn("Image generation failed. Posting text-only tweet.");
      await twitterClient.v2.tweet({ text: tweet });
    }
  } else {
    // Post a text-only tweet
    await twitterClient.v2.tweet({ text: tweet });
    console.log(`Text-only tweet posted: ${tweet}`);
  }
}

// Main function to generate and post tweets
async function main() {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_RUNTIME) {
    await postTweet();
    const delay = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000; // Random delay between 5 and 15 minutes
    console.log(`Waiting ${delay / 1000 / 60} minutes before the next tweet.`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  console.log("30 minutes elapsed. Stopping the bot.");
}

main();

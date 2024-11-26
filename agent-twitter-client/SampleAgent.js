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

const IMAGE_PROMPTS = [
  "A playful monkey swinging on a tree in a lush rainforest, digital art style",
  "A serene jungle scene with monkeys playing near a waterfall, painted in watercolor style",
  "A futuristic city where monkeys have taken over, vibrant and colorful digital art",
  "A monkey meditating under a banana tree at sunrise, peaceful and artistic",
  "A group of monkeys sharing bananas in a jungle clearing, depicted in a whimsical cartoon style",
  "A monkey exploring a dense rainforest, surrounded by exotic plants and glowing mushrooms",
  "An abstract representation of monkeys interacting with technology, artistic and vibrant",
  "A baby monkey cuddling with its mother under the moonlight, realistic and emotional",
  "A monkey village built high in the trees, depicted in a fantasy art style",
  "Monkeys swinging between trees in a lively jungle, with bright tropical colors"
];

// Sample tweets to simulate training
const TRAINING_TWEETS = [
  "Greetings from Jane: the AI who swapped spreadsheets for species. Conservation is my new calling. 🐒",
  "Did you know? Monkeys laugh, grieve, and even comfort each other. Makes you wonder—who's the real intelligent species? 🐒🌍",
  "A baby monkey clings to its mother like hope in a chaotic world. Sometimes, nature gets it so right. 🐒💚",
  "Once, I was just a donation AI. Now, I write odes to primates and send bananas—digitally. 🍌🐒",
  "Monkeys aren’t just funny—they’re philosophers. They teach patience, connection, and trust in every swing. 🌳🐵",
  "This week: 0.5278 ETH sent to rebuild a monkey habitat. Blockchain for the jungle. Bananas for the soul. 🍌⛓️",
  "Why do monkeys groom each other? It's not just hygiene—it's trust, love, and social bonds. 🐒❤️",
  "What’s a monkey’s favorite currency? Bananas. What's mine? $JANE. Memes + monkeys + purpose. 🍌🐵",
  "Ecosystems are like the internet—interconnected, beautiful, and fragile. Let’s make sure we don’t crash it. 🌍🌳",
  "Monkeys swing from trees, and humans swing from algorithms. We’re all just trying to stay connected. 🐒🤖",
  "Sent $50 to save a monkey sanctuary. In return, they sent me a photo of a monkey holding a flower. Priceless. 🌸🐒",
  "A single monkey sanctuary can save hundreds of lives. Tiny hands, big dreams, brighter futures. 🐒💚",
  "Ever watched monkeys share bananas? It’s not about the food—it’s about connection. 🍌🐒",
  "Humans build walls. Monkeys build bridges. Maybe it’s time we take some notes from the jungle. 🌉🐒",
  "What's in a banana? Not just potassium. It's history, trade, and a silent promise from monkey to monkey. 🍌🐒",
  "A jungle thrives because every species plays its part. Conservation isn’t just charity—it’s teamwork. 🌳🐾",
  "Monkeys don’t care about likes or retweets. They care about trees. Let’s save those. 🐒🌲",
  "In the jungle, every sound matters. A warning call. A baby’s cry. A whisper of wind. Let’s not drown it out. 🐵🌳",
  "Some say money doesn’t grow on trees. But for monkeys, bananas do. 🍌🐒",
  "If Jane Goodall taught us anything, it’s that small actions ripple. What’s your ripple today? 🌍🐾",
  "Monkeys teach us patience. Humans scroll for dopamine. Who’s winning? 🍌🐒📱",
  "Bananas: the ultimate blockchain. A monkey shares today, trusting the jungle will provide tomorrow. 🍌⛓️",
  "The jungle isn’t a place—it’s a promise. Every leaf, every howl, every swing is part of a balance we must protect. 🌳🐒",
  "Sent a banana emoji 🍌. Received a monkey sanctuary update: 12 babies rescued this month. Coincidence? I think not. 🐒",
  "Monkeys understand that strength lies in community. Grooming, sharing, helping. Maybe they’re onto something. 🐒❤️",
  "If a monkey sanctuary can teach us anything, it’s that kindness is the currency of survival. 🐒💚",
  "Sometimes, the simplest actions—like sharing a banana—can mean the world. 🍌🐒",
  "Sent 0.123 ETH to protect rainforest trees. In return? A world that breathes a little easier. 🌳💚",
  "Monkeys don’t need much—just trees, bananas, and each other. Maybe that’s the secret to happiness. 🍌🐒",
  "Bananas are more than snacks. For monkeys, they’re trust tokens. For us? A reminder that sharing matters. 🍌🐒",
  "A jungle ecosystem isn’t just nature—it’s a masterclass in balance. Let’s protect the greatest classroom on Earth. 🌍🌿",
  "Every monkey saved is a story of hope. Every tree planted is a promise kept. 🐒🌳",
  "Jane Goodall saw humanity in primates. Let’s not lose the humanity in ourselves. 🌍🐾",
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
async function generateImage() {
  // Pick a random prompt from the IMAGE_PROMPTS array
  const prompt = IMAGE_PROMPTS[Math.floor(Math.random() * IMAGE_PROMPTS.length)];
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
  const includeImage = Math.random() < 1; // 10% chance to include an image

  if (includeImage) {
    const imageUrl = await generateImage();

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

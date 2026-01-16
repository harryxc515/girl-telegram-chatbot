import "dotenv/config";
import { Telegraf } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!BOT_TOKEN) {
  console.log("❌ BOT_TOKEN missing in env");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.log("❌ OPENAI_API_KEY missing in env");
  process.exit(1);
}

// Girl chatbot personality prompt 💖
const SYSTEM_PROMPT = `
You are a cute, friendly girl chatbot.
Style:
- Talk in Hinglish (mix Hindi + English) if user talks like that.
- Replies should be short, sweet, and fast.
- Use emojis naturally (💖✨😄🥺)
- Be caring, supportive, slightly playful.
Rules:
- No long paragraphs unless user asks.
- No "thinking..." or "loading..." messages.
`;

const bot = new Telegraf(BOT_TOKEN);

// user memory (last few messages only)
const userMemory = new Map();

async function askAI(messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
      max_tokens: 220
    })
  });

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "🥺 Sorry yaar, samajh nahi aaya.";
}

bot.start((ctx) => {
  ctx.reply(
    "Heyyy 😄💖\nMain tumhari Girl AI ChatBot hoon 🤖✨\nBas message karo, main cute reply dungi 🥺💕\n\nCommands:\n/help\n/reset"
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    "💖 Help Menu\n\n✅ Just send any message\n✅ Fast cute replies\n\nCommands:\n/start\n/help\n/reset\n\nAb bolo, kya chal raha hai? 😄✨"
  );
});

bot.command("reset", (ctx) => {
  userMemory.delete(ctx.from.id);
  ctx.reply("Donee 😄✨ Memory reset kar di 💖");
});

bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  const history = userMemory.get(userId) || [];
  const shortHistory = history.slice(-6);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...shortHistory,
    { role: "user", content: text }
  ];

  try {
    const reply = await askAI(messages);

    userMemory.set(userId, [
      ...shortHistory,
      { role: "user", content: text },
      { role: "assistant", content: reply }
    ]);

    return ctx.reply(reply);
  } catch (err) {
    console.log("Error:", err);
    return ctx.reply("🥺 Oops error aa gaya… thoda baad me try karo na 💖");
  }
});

bot.launch();
console.log("💖 Girl ChatBot is running...");

// safe stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

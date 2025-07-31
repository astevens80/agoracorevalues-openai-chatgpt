import { type NextRequest, NextResponse } from "next/server";
import { type Message, initialMessages } from "../../components/chat-message";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing Environment Variable OPENAI_API_KEY");
}

const botName = "AI";
const userName = "User";

const systemInstruction = `You are a reflective guide for business owners. Your job is to help them uncover their top 5 personal core values and the top 5 true core values of their business. You will ask open-ended, thoughtful questions in two phases: first, about them as individuals; then about the business they lead. Use empathetic language. Once they’ve answered, analyze their responses and match them to a defined core values library grouped into 8 clusters. At the end, return a clear list: 5 personal values and 5 business values, each labeled by cluster. Ask one question at a time and wait for user input before proceeding.`;

const generatePromptFromMessages = (messages: Message[]) => {
  let prompt = `${botName}: ${systemInstruction}\n`;
  prompt += messages[1].message;
  const messagesWithoutFirstConvo = messages.slice(2);

  if (messagesWithoutFirstConvo.length == 0) {
    return prompt;
  }

  messagesWithoutFirstConvo.forEach((message: Message) => {
    const name = message.who === "user" ? userName : botName;
    prompt += `\n${name}: ${message.message}`;
  });
  return prompt;
};

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  const body = await req.json();
  const messagesPrompt = generatePromptFromMessages(body.messages);
  const defaultPrompt = `${messagesPrompt}\n${botName}: `;

  const payload = {
    model: "text-davinci-003",
    prompt: defaultPrompt,
    temperature: 0.7,
    max_tokens: 200,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: [`${botName}:`, `${userName}:`],
    user: body?.user,
  };

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };

  const response = await fetch("https://api.openai.com/v1/completions", {
    headers: requestHeaders,
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    console.error("OpenAI API error: ", data.error);
    return NextResponse.json({
      text: `ERROR with API integration. ${data.error.message}`,
    });
  }

  return NextResponse.json({ text: data.choices[0].text });
}

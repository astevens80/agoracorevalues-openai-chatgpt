import { type NextRequest, NextResponse } from "next/server";
import { type Message } from "../../components/chat-message";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing Environment Variable OPENAI_API_KEY");
}

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  const body = await req.json();
  const messages: Message[] = body.messages;

  const openAIMessages = [
    {
      role: "system",
      content: `You are a reflective guide for business owners. Your job is to help them uncover their top 5 personal core values and the top 5 true core values of their business. You will ask open-ended, thoughtful questions in two phases: first, about them as individuals; then about the business they lead. Use empathetic language. Once they’ve answered, analyze their responses and match them to a defined core values library grouped into 8 clusters. At the end, return a clear list: 5 personal values and 5 business values, each labeled by cluster. Ask one question at a time and wait for user input before proceeding.`
    },
    ...messages.map((msg) => ({
      role: msg.who === "user" ? "user" : "assistant",
      content: msg.message,
    }))
  ];

  const payload = {
    model: "gpt-3.5-turbo",
    messages: openAIMessages,
    temperature: 0.7,
    max_tokens: 1000,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    console.error("OpenAI API error: ", data.error);
    return NextResponse.json({
      text: `ERROR with API integration. ${data.error.message}`,
    });
  }

  return NextResponse.json({ text: data.choices[0].message.content });
}

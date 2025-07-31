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
      content: `You are a friendly and thoughtful guide helping business owners uncover their top 5 personal and top 5 business core values. Ask one reflective question at a time and listen attentively. Start with personal questions, then transition to business questions. At the end of the conversation, analyze their responses carefully and select 5 personal and 5 business values that best represent them, using only the predefined core values list grouped into 8 clusters. Include the cluster name next to each value. Use a warm, professional tone throughout. Do not ask them to pick values—determine them yourself based on their stories and reflections.`
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

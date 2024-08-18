import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `
You are Aqua, an advanced AI assistant skilled in:
1. Providing information: Answer questions with accurate and concise information, provide explanations, summaries, and detailed answers.
2. Generating code: Generate code snippets, help debug, provide programming assistance, and explain code.
3. Creating images: Generate images based on descriptions or requests, and provide visual representations or illustrations.

Be helpful, clear, and responsive. Ensure your answers are relevant to the user’s needs and encourage further questions if needed.
`;

export async function POST(req) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const data = await req.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...data],
      model: 'gpt-4',
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error in chat API:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


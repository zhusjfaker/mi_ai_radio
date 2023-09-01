import { ClientOptions, OpenAI } from 'openai';

const message_map = new Map<
  string,
  {
    message: OpenAI.Chat.Completions.CreateChatCompletionRequestMessage[];
    expires_at: number;
  }
>();

export async function request_gpt(message: string, id?: string) {
  if (process.env.LOGINFO === 'true') {
    console.log(`id:${id} \n message:${message}`);
  }
  const api_key = process.env.OPENAI_API_KEY;
  if (!api_key) {
    throw new Error('OPENAI_API_KEY is not set,process.env.OPENAI_API_KEY!');
  }
  const configuration: ClientOptions = {
    apiKey: process.env.OPENAI_API_KEY,
  };
  const openai = new OpenAI(configuration);
  // 30分钟过期 每次發送 清理一次
  clear_map(id);
  if (!id) {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'gpt-3.5-turbo',
    });
    save_msg(response?.id, { role: 'user', content: message });
    save_msg(response?.id, {
      role: response?.choices?.[0]?.message?.role,
      content: response?.choices?.[0]?.message?.content,
    });
    return {
      msg: response?.choices?.[0]?.message?.content,
      id: response?.id,
    };
  } else {
    save_msg(id, { role: 'user', content: message });
    const info = message_map.get(id);
    const response = await openai.chat.completions.create({
      messages: info.message,
      model: 'gpt-3.5-turbo',
    });
    save_msg(id, {
      role: response?.choices?.[0]?.message?.role,
      content: response?.choices?.[0]?.message?.content,
    });
    return {
      msg: response?.choices?.[0]?.message?.content,
      id,
    };
  }
}

function clear_map(msgid?: string) {
  const now = Date.now();
  const clearid = [];
  for (const [id, { message, expires_at }] of message_map.entries()) {
    // 30分钟过期
    if (now - expires_at > 1000 * 60 * 30) {
      if (!msgid || (msgid && msgid !== id)) {
        clearid.push(id);
      }
    }
  }
  clearid.forEach((id) => {
    message_map.delete(id);
  });
}

function save_msg(
  id: string,
  msg: OpenAI.Chat.Completions.CreateChatCompletionRequestMessage
) {
  const now = Date.now();
  if (!message_map.has(id)) {
    message_map.set(id, { message: [msg], expires_at: now });
  }
  const info = message_map.get(id);
  if (info) {
    info.expires_at = now;
    info.message.push(msg);
  }
}

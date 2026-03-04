const randomFallback = () =>
  Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export const generateChatId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `chat_${randomFallback()}`;
};

export const generateMessageId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg_${randomFallback()}`;
};


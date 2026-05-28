export const POKE_MESSAGES = [
  "girl... where's the workout 👀",
  "she's slacking 💀",
  'your future self is watching ✨',
  '...you up babe?',
  'do it for the plot 🎬',
  'we said gym era, remember?',
  'be that girl today bestie',
  'the mirror is calling 🪞',
  "it's giving... rest day again?",
  "we're not skipping today no 💅",
  'your pump is missing you',
  'channel that hot girl walk energy',
  'main character moment incoming',
  "delulu won't lift it for you 🏋️‍♀️",
  'soft launch a workout pls',
  'the algorithm wants your sweat selfie',
  "it's a sign. open the app",
  "you said you'd be that girl 😤",
  'your gym fit is begging 👜',
  "we're booked and busy (in the gym) 📍",
];

export function pickRandomPokeMessage(): string {
  return POKE_MESSAGES[Math.floor(Math.random() * POKE_MESSAGES.length)];
}

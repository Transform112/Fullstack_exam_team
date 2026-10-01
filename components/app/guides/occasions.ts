export type OccasionGuide = {
  slug: string;
  name: string;
  number: string;
  short: string;
  title: string;
  introduction: string;
  colour: string;
  motif: string;
  opening: string;
  approach: { title: string; body: string }[];
  prompts: string[];
  starters: { label: string; text: string; tip: string }[];
  checklist: string[];
  avoid: string;
  template: string;
  templateReason: string;
};

export const OCCASION_GUIDES: OccasionGuide[] = [
  {
    slug: "birthday",
    name: "Birthdays",
    number: "01",
    short: "For another year of being wonderfully them.",
    title: "A birthday that feels like them.",
    introduction: "The best birthday surprise is not the biggest one. It is the one that remembers the small things: their favourite story, the running joke, the way they always show up.",
    colour: "#ead8b6",
    motif: "Another trip around the sun.",
    opening: "Start with a memory, not a list of compliments. A tiny, recognisable detail makes your message sound like you from the first line.",
    approach: [
      { title: "Set the mood", body: "Would they love a big, bright celebration or a quieter note? Choose a design that matches their personality rather than guessing from their age." },
      { title: "Tell a small story", body: "Pick three moments: how you met, something you still laugh about, and a recent memory. Add one sentence about why each stayed with you." },
      { title: "Look ahead", body: "Finish with something you want to do together in the coming year. A specific plan is warmer than a long list of general wishes." },
    ],
    prompts: [
      "What is a tiny thing they do that makes a room feel better?",
      "Which ordinary day together deserves its own celebration?",
      "What would you like them to remember when the year gets difficult?",
      "What is one adventure you still owe each other?",
    ],
    starters: [
      { label: "For your best friend", text: "Another year of you, and somehow I am still finding new reasons to be glad we met. My favourite part of this year was…", tip: "Finish with a real moment, even if it sounds wonderfully ordinary." },
      { label: "For family", text: "Some of my safest, happiest memories have you in them. Today I wanted to give a few of those memories back to you…", tip: "Choose a story they may not know you remember." },
      { label: "A little playful", text: "Official birthday announcement: you are still my favourite person to make questionable plans with. This year's evidence includes…", tip: "Keep the joke kind and the ending heartfelt." },
    ],
    checklist: [
      "Check the spelling of their name or nickname.",
      "Choose photos they would be happy for others to see.",
      "Add captions that explain the memory, not just the place.",
      "If scheduling, check the reveal date and time before publishing.",
      "Read the whole page once on your phone before sharing it.",
    ],
    avoid: "Skip embarrassing photos, sensitive age jokes and surprises that depend on private information. A shared link may travel further than you expect.",
    template: "Neon Night",
    templateReason: "A lively starting point for the friend who makes every plan feel like an event. Prefer something gentler? Pastel Dream works just as well for a birthday.",
  },
  {
    slug: "anniversary",
    name: "Anniversaries",
    number: "02",
    short: "For the story you keep choosing together.",
    title: "Your story, in the little details.",
    introduction: "An anniversary page does not need to tell your entire history. Let it hold a few moments that say: I notice this life we are making, and I am glad it is with you.",
    colour: "#dcc9cd",
    motif: "Still my favourite chapter.",
    opening: "Think beyond the milestones. The train ride, the burnt dinner, the quiet support on a hard day: these often say more than a perfect holiday photo.",
    approach: [
      { title: "Find your thread", body: "Choose one idea to connect the page: places you have called home, things you have learned together, or ordinary days that became favourite memories." },
      { title: "Give each photo a voice", body: "Write what the camera did not capture. A caption can explain what you felt, the conversation that followed, or why you kept returning to that picture." },
      { title: "Leave room for tomorrow", body: "End with a simple hope for the next chapter. It can be a big dream or a promise to protect a small ritual you both love." },
    ],
    prompts: [
      "When did an ordinary moment suddenly feel like home?",
      "What have they taught you without trying to teach you?",
      "Which ritual would you miss most if it disappeared?",
      "What do you hope you are still doing together years from now?",
    ],
    starters: [
      { label: "Quiet and sincere", text: "When I think about us, I do not start with the big moments. I think about…", tip: "Name a routine or a small kindness that belongs to your relationship." },
      { label: "For a milestone", text: "We have made a lot of memories since that first chapter. The part I am proudest of is how we…", tip: "Celebrate something you built together, not just time passing." },
      { label: "Looking forward", text: "If the next chapter has more of our slow mornings, our unexpected detours, and you beside me, I think we are doing alright…", tip: "Swap the examples for details that are unmistakably yours." },
    ],
    checklist: [
      "Choose a few moments rather than every photo you have.",
      "Check dates without letting perfect chronology slow you down.",
      "Keep private stories private if you plan to share the link widely.",
      "Consider a password for a more personal collection.",
      "Make the final line sound like something you would say aloud.",
    ],
    avoid: "Avoid turning the page into a scorecard of who did what. This is a place for appreciation, not a public version of a private conversation.",
    template: "Royal Gold",
    templateReason: "A framed greeting and restrained golden details leave space for a meaningful letter. It is a good match for a slower, more reflective story.",
  },
  {
    slug: "farewell",
    name: "Farewells",
    number: "03",
    short: "For a new chapter, with a little of the old one.",
    title: "A goodbye worth keeping.",
    introduction: "When someone leaves a team, a city or a familiar routine, a few specific memories can turn a goodbye into something they carry with them.",
    colour: "#d5dfd2",
    motif: "Same people. New places.",
    opening: "Make the page about what they brought to the group. A sincere example of their impact is more useful than a dozen versions of “we will miss you.”",
    approach: [
      { title: "Gather a few voices", body: "Ask people for one memory or one thing they learned from the person. Give them a short prompt so the messages feel different from each other." },
      { title: "Build a shared timeline", body: "Start with an early moment, add a challenge you got through together, then a memory that captures what the group became." },
      { title: "Make the future welcoming", body: "Wish them well without making them feel guilty for leaving. End with an invitation to stay in touch that you actually intend to follow through on." },
    ],
    prompts: [
      "What will people still quote after they leave?",
      "When did they make a difficult day easier?",
      "What has changed for the better because they were here?",
      "Which memory would explain this group to someone new?",
    ],
    starters: [
      { label: "For a teammate", text: "You made this place better in ways that do not fit into a job title. I will especially remember the time you…", tip: "Use a concrete example of their kindness, craft or support." },
      { label: "For a friend moving away", text: "The distance is about to change. The part where you are one of my people is not. Before the next chapter starts, here are a few things I want you to take with you…", tip: "Mention a realistic way you will keep in touch." },
      { label: "From the whole group", text: "We each tried to choose one favourite memory of you. Unsurprisingly, nobody could keep it to just one…", tip: "Keep names attached to contributions so each voice stays personal." },
    ],
    checklist: [
      "Ask contributors before including their names or messages.",
      "Remove confidential workplace details from stories and images.",
      "Check that in-jokes feel welcoming rather than excluding.",
      "Let someone else proofread names and dates.",
      "Share the link when the recipient has time to enjoy it.",
    ],
    avoid: "Do not include contact details, workplace documents or a new address in a public page. Keep goodbyes generous; leaving should not feel like letting the group down.",
    template: "Royal Gold",
    templateReason: "Its calm layout lets several messages feel like one considered keepsake. For a lighter goodbye between close friends, try Pastel Dream.",
  },
  {
    slug: "friendship",
    name: "Friendship",
    number: "04",
    short: "For your person, no special date required.",
    title: "Because some people just get you.",
    introduction: "You do not need a milestone to tell a friend they matter. A small page of familiar stories can be the nicest thing in an otherwise ordinary week.",
    colour: "#e5cfbe",
    motif: "All the little things. All of us.",
    opening: "Let the page sound like your friendship. It can be funny, understated, sentimental, or a combination. You do not have to become a different writer to be sincere.",
    approach: [
      { title: "Choose your recurring theme", body: "Your friendship might live in late-night calls, terrible films, shared meals or long walks. Use one of those familiar threads to make the page feel instantly recognisable." },
      { title: "Mix silly with sincere", body: "Put a funny memory next to a genuine thank-you. The contrast can say more than an uninterrupted page of either jokes or big emotions." },
      { title: "Make the next plan", body: "Finish with a small invitation: another walk, the trip you keep talking about, or a call when life gets busy again." },
    ],
    prompts: [
      "Which conversation would make no sense to anybody else?",
      "When have they made it easier to be yourself?",
      "What is your most ordinary, most comforting shared tradition?",
      "What have you never properly thanked them for?",
    ],
    starters: [
      { label: "Just because", text: "No birthday. No big announcement. Just a reminder that life is a lot better with you in it, especially when…", tip: "Follow with a moment from everyday life." },
      { label: "For the long-distance friend", text: "We may be collecting memories in different places right now, but you are still the person I want to tell when…", tip: "Let them know which small things still make you think of them." },
      { label: "A overdue thank-you", text: "I probably made a joke instead of saying this properly at the time, but when you showed up for me, it meant…", tip: "You can keep it short. A clear thank-you does not need decoration." },
    ],
    checklist: [
      "Keep jokes understandable to the person the page is for.",
      "Balance group photos with a few memories of just you two.",
      "Use the nickname they actually like.",
      "Consider whether they prefer a private message or a group reveal.",
      "Leave them room to respond in their own way.",
    ],
    avoid: "A public surprise is not for everyone. If your friend dislikes attention, send the link quietly and let them decide whether to share it.",
    template: "Pastel Dream",
    templateReason: "A scrapbook mood suits the slightly chaotic, deeply familiar archive of a friendship. Neon Night is there for the louder version of your story.",
  },
  {
    slug: "custom",
    name: "Your own occasion",
    number: "05",
    short: "For the moments that do not need a category.",
    title: "If it matters to you, it counts.",
    introduction: "A new job, a finished exam, a personal first, a thank-you after a difficult month. Some of the most meaningful celebrations never make it onto a calendar.",
    colour: "#d8d4e3",
    motif: "A little moment. A lot of meaning.",
    opening: "Name what you are celebrating in plain language. Then explain why it matters to this particular person. The meaning is more important than a formal occasion.",
    approach: [
      { title: "Give the moment a name", body: "Use a short occasion label that feels natural: “Your first exhibition”, “You did it”, or “A very big thank-you”. It should make sense at a glance." },
      { title: "Notice the journey", body: "Mention the effort, patience or courage behind the moment. Celebrating the process makes the note meaningful even after the excitement fades." },
      { title: "Keep the scale comfortable", body: "A few thoughtful words may be enough. Add photos or a timeline only when they help tell the story, rather than filling space for its own sake." },
    ],
    prompts: [
      "What did this moment require that other people might not see?",
      "What would you say if you had one uninterrupted minute with them?",
      "Which detail proves that you have been paying attention?",
      "What should they feel after they finish reading?",
    ],
    starters: [
      { label: "For an achievement", text: "I know this was more than one good day. I saw the work, the waiting, and the times you kept going anyway. Today I hope you let yourself feel…", tip: "Celebrate their effort without making assumptions about what comes next." },
      { label: "For a thank-you", text: "What you did might have felt small to you. From my side, it changed…", tip: "Describe the difference their action made." },
      { label: "For a fresh start", text: "You do not have to have the whole next chapter figured out. I just wanted you to begin it knowing…", tip: "Offer encouragement without promising outcomes you cannot know." },
    ],
    checklist: [
      "Write a clear custom occasion label.",
      "Keep the recipient's comfort ahead of the surprise.",
      "Use only details they would be happy to have shared.",
      "Choose a design that supports the tone of your message.",
      "Check the preview and send it at a thoughtful time.",
    ],
    avoid: "Do not turn a difficult personal experience into a public celebration without checking first. Thoughtfulness sometimes means making the gesture smaller and more private.",
    template: "Your choice",
    templateReason: "There is no prescribed mood here. Explore the collection and choose the style that fits the feeling you want to leave behind.",
  },
];

export function findOccasion(slug: string) {
  return OCCASION_GUIDES.find((occasion) => occasion.slug === slug);
}

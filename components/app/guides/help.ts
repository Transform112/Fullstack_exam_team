export const HELP_CATEGORIES = ["All questions", "Getting started", "Writing & media", "Sharing & privacy", "Managing pages"] as const;
export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export type HelpArticle = {
  id: string;
  category: Exclude<HelpCategory, "All questions">;
  question: string;
  answer: string;
  detail?: string;
  link?: { href: string; label: string };
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "start",
    category: "Getting started",
    question: "What do I need before I start?",
    answer: "A person to celebrate and a few words for them are enough. You can collect photos and memories as you go. Start by creating an account, then choose Create a surprise from your dashboard.",
    detail: "The creator walks through occasion, recipient, words, media, style and review. You do not need to write code or arrange a page manually.",
    link: { href: "/signup", label: "Create your account" },
  },
  {
    id: "preview",
    category: "Getting started",
    question: "Can I explore the designs before signing up?",
    answer: "Yes. Open the collection and select Preview design. The preview uses example text so you can see the layout and feel of a design before starting your own page.",
    detail: "Preview content is a sample. It is not a published page, and the sample wishes area does not submit messages.",
    link: { href: "/templates", label: "Explore the collection" },
  },
  {
    id: "occasions",
    category: "Getting started",
    question: "Does my occasion have to fit a category?",
    answer: "No. The creator includes a custom occasion option. Give your moment a short name that the recipient will recognise, whether it is a personal achievement, a thank-you or a new beginning.",
    link: { href: "/occasions/custom", label: "Find ideas for your own occasion" },
  },
  {
    id: "account",
    category: "Getting started",
    question: "Does the recipient need an account?",
    answer: "A recipient opens a published celebration through its shared link. They do not need a creator account to read an available public page. If you add a password or a scheduled reveal, those access conditions still apply.",
  },
  {
    id: "languages",
    category: "Writing & media",
    question: "Which languages can I use?",
    answer: "Wishly supports English, Hinglish and Hindi for the generated page interface. Choose the language in the creator. Your own message stays as you write it, so use the words and language that feel natural to your relationship.",
    detail: "Switching the page language does not automatically translate your personal message. Read your own text in the preview before publishing.",
  },
  {
    id: "message",
    category: "Writing & media",
    question: "What should I write if I am not good with words?",
    answer: "Begin with one memory and one reason the person matters to you. Specific details are more personal than a long list of compliments. A short message in your own voice is a good message.",
    detail: "Our occasion guides include original starting lines and questions. Copy a beginning if it helps, then add a memory only you could tell.",
    link: { href: "/occasions", label: "Browse writing inspiration" },
  },
  {
    id: "photos",
    category: "Writing & media",
    question: "How should I choose photos?",
    answer: "Choose photos that tell different parts of the story. A mix of everyday moments and milestones is often more meaningful than several nearly identical pictures. Add a caption when the image needs context.",
    detail: "Use images you have permission to share and that the recipient would be comfortable seeing on the page. The uploader shows supported file requirements and limits while you create.",
  },
  {
    id: "upload",
    category: "Writing & media",
    question: "What should I do if a photo or video will not upload?",
    answer: "Check the message shown beside the upload, confirm the file meets the displayed size and format requirements, and make sure your connection is working. Retry after the connection returns.",
    detail: "If several supported files fail, the upload service may be unavailable. Keep your original files and avoid assuming an upload finished until it appears in the media list.",
  },
  {
    id: "music",
    category: "Writing & media",
    question: "Why does music not start immediately?",
    answer: "Browsers commonly require an interaction before playing sound. A live recipient page begins with an opening action, and the music control lets the visitor manage audio. Design previews do not play music.",
    detail: "Audio also depends on the selected track being available. Video playback pauses the page music so the two do not compete.",
  },
  {
    id: "password",
    category: "Sharing & privacy",
    question: "Can I add a password to a surprise?",
    answer: "The Style step includes an optional password. A password-protected page asks visitors to unlock it before showing the celebration. Send the password separately if you do not want it travelling with the link.",
    detail: "Choose a password you can share with your intended recipient. Do not reuse the password for your account or another service.",
  },
  {
    id: "schedule",
    category: "Sharing & privacy",
    question: "Can I prepare a page before the occasion?",
    answer: "Yes. The creator has an optional reveal date and time. A scheduled page shows its countdown until the reveal time rather than exposing the celebration early.",
    detail: "Double-check the date and time shown in review, especially if you and the recipient are in different time zones. A scheduled reveal controls access; it does not send the link for you.",
  },
  {
    id: "share",
    category: "Sharing & privacy",
    question: "How do I send the finished page?",
    answer: "Publish the page to create its share link. The sharing tools let you copy the link, download a QR code, or open a supported sharing destination. You decide who receives it.",
    detail: "A copied link or downloaded QR code is not a sent message. Complete the sharing action in the app you choose.",
  },
  {
    id: "public",
    category: "Sharing & privacy",
    question: "Who can open a shared page?",
    answer: "Treat an available page link as something that can be forwarded. Without a password, people who receive the link can open it. Avoid including addresses, private documents or details you do not want passed on.",
    detail: "A password offers another access step, but the recipient can still share what they see. Choose the content with that in mind.",
  },
  {
    id: "wishes",
    category: "Sharing & privacy",
    question: "Can friends leave a message?",
    answer: "Enable the wishes wall in the creator to let visitors add a short wish. The live form asks for a name and message. Submissions can be limited or rejected by the service, and any error is shown rather than treated as a success.",
    detail: "You can review wishes from the page's insights area. The sample wall in a template preview does not accept submissions.",
  },
  {
    id: "draft",
    category: "Managing pages",
    question: "How do I know my changes are saved?",
    answer: "Watch the save status in the creator. Saved confirms a completed save; Saving means a request is still underway. Offline or error states need attention before you leave the page.",
    detail: "You can use Save draft and retry an unsuccessful write. A local recovery prompt may offer unsaved edits after a refresh, but it is still best to wait for the saved status.",
  },
  {
    id: "edit",
    category: "Managing pages",
    question: "Can I return to a page later?",
    answer: "Open your dashboard to see your pages and continue editing. A draft can be finished later; a published page can be edited through its page actions. Check the review step before updating the finished page.",
    link: { href: "/dashboard", label: "Open your dashboard" },
  },
  {
    id: "unpublish",
    category: "Managing pages",
    question: "What is the difference between unpublishing and deleting?",
    answer: "Unpublishing takes a page out of its published state while keeping it in your account. Deleting removes the page and its associated content. Read the confirmation carefully before choosing a destructive action.",
    detail: "If you only want to stop sharing for now, review the unpublish option before considering deletion.",
  },
  {
    id: "conflict",
    category: "Managing pages",
    question: "Why does the creator say the page changed elsewhere?",
    answer: "The page may have been edited in another tab or session. The creator pauses conflicting writes so one set of changes does not silently replace another. Review the recovery options shown on screen.",
    detail: "Reload uses the latest saved version. Keeping your edits can replace newer changes, so use it only after deciding which version you want. Working in one tab helps avoid this situation.",
  },
  {
    id: "unavailable",
    category: "Managing pages",
    question: "What if a link is unavailable or I cannot sign in?",
    answer: "Check the link and your account details first. A page may be unpublished, deleted, restricted or temporarily unavailable. An account or service error cannot be fixed by changing the page design.",
    detail: "Keep a copy of your original text and media, and retry when the service is available. Do not keep submitting the same action if the interface is still waiting for a response.",
  },
];

export function normalizeSearch(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function searchHelp(query: string, category: HelpCategory) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return HELP_ARTICLES.filter((article) => {
    if (category !== "All questions" && article.category !== category) return false;
    const text = normalizeSearch(`${article.question} ${article.answer} ${article.detail ?? ""}`);
    return words.every((word) => text.includes(word));
  });
}

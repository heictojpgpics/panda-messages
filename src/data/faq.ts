/** FAQ content. One source: the section component and the page's JSON-LD. */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "Can I see it before I pay?",
    a: "Yes. Build the card, open the preview, and check every detail before checkout. Panda sends it only after you choose delivery.",
  },
  {
    q: "Does the person I send it to need an account?",
    a: "No. They never even see a signup screen. They get an email that looks like a delivery, tap it, and the envelope opens. That is the entire experience from their side.",
  },
  {
    q: "Can I schedule it in advance?",
    a: "That is the main move. Pick the day, any day, months out, and Panda lands it in their inbox that morning. You can edit or cancel any time before it sends, with a full refund. Set it at 2am in a burst of competence, then forget about it guilt-free.",
  },
  {
    q: "Will they know it's from me?",
    a: "Yes, if you want them to. Your name goes on the card and in the delivery. If you would rather stay mysterious, leave the sender name as something cryptic and enjoy the chaos.",
  },
  {
    q: "What if I make a mistake?",
    a: "Until the moment it sends, the card is fully editable from your dashboard, down to the last comma. After it sends, the link is live, but a quick email to support and we will usually sort you out. We are nice about it.",
  },
  {
    q: "What if it doesn't arrive?",
    a: "Then we refund you immediately, no forms, no interrogation. Deliveries are tracked on your dashboard, so you will see the moment it lands anyway. But if the internet eats one, it is on us.",
  },
  {
    q: "Can I send it myself instead?",
    a: "Every card is delivered through Panda so we can protect the private link, track delivery, and keep the moment complete. You can choose the day it arrives.",
  },
  {
    q: "Is there a subscription?",
    a: "No. It is $5 per card, once, when you want it. The only recurring thing anywhere will be Panda Remembers, the optional birthday service, planned at $19 a year with cancel any time.",
  },
  {
    q: "How long does it take to make one?",
    a: "About a minute if you know what you want to say. About four minutes if you browse the message ideas, which people mostly do, and which we fully endorse.",
  },
  {
    q: "How do reactions and replies work?",
    a: "When they open the card, they can tap a heart, or write a little reply back. Your dashboard updates live. It is the closest thing to watching their face while they read it.",
  },
];

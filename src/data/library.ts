/**
 * The message ideas library. These are the SEO pages: real, hand-written
 * message ideas people can copy into texts and cards, each ending with a
 * path to put the words on an actual Panda card.
 */

export interface LibraryMessage {
  text: string;
}

export interface LibraryPage {
  slug: string;
  title: string;
  category: string;
  heading: string;
  intro: string;
  messages: string[];
  /** Longer notes for when a text is not enough. */
  longer: string[];
  tips: string[];
}

export const LIBRARY_CATEGORIES = [
  { id: "birthday", label: "Birthday", emoji: "🎂" },
  { id: "love", label: "Love", emoji: "💚" },
  { id: "morning-night", label: "Good morning & night", emoji: "☀️" },
  { id: "miss-you", label: "I miss you", emoji: "✉️" },
  { id: "thanks", label: "Thank you", emoji: "🙌" },
  { id: "occasion", label: "Special occasions", emoji: "🎄" },
];

export const LIBRARY: LibraryPage[] = [
  {
    slug: "birthday-wishes-for-mom",
    title: "Birthday Wishes for Mom",
    category: "birthday",
    heading: "Birthday wishes for mom",
    intro:
      "Mom heard every word you ever mumbled, so a few good ones back on her birthday is the least you can do. Pick one, copy it, send it. Or put it on a card and let a panda deliver it on the morning itself.",
    messages: [
      "Happy birthday, Mom. Everything soft and good in me started with you.",
      "You made ordinary days feel safe, which I only understood later. Thank you. Happy birthday.",
      "Happy birthday to the person who still worries about whether I am eating enough. I am, Mom. Mostly.",
      "Another year of being right about basically everything. Happy birthday, Mom.",
      "Happy birthday to the first person I call, for good news and bad. Love you.",
      "You are the reason home still feels like home, even after all these years. Happy birthday, Mom.",
      "Happy birthday, Mom. I hope today is as warm as every kitchen you ever made.",
      "For your birthday, I would give you a quiet morning, a long breakfast, and no dishes. Starting with this wish.",
      "Happy birthday to the woman who fixes problems I did not know she could hear. You are remarkable.",
      "Mom, you do not ask for much, so: one entire day that revolves around you. That is the rule today. Happy birthday.",
    ],
    longer: [
      "Happy birthday, Mom. I have been trying to find the words all week and they kept coming out too small, so here is the honest version. Everything I know about patience, and about showing up, I learned by watching you. The older I get the more I notice it, in the way I make tea the way you did, or calm people down without them noticing. You are in all my better habits. I hope this year gives you back a fraction of what you handed out. I love you.",
      "Mom, happy birthday. There is a specific kind of tired that comes from loving a family for decades, and you carried it like it was nothing. It was not nothing. I saw it, even when I pretended not to. Today I want you to sit down early and let somebody else remember where things go. You have earned a year of softer days, and I intend to help make that happen. Love you always.",
    ],
    tips: [
      "The specific beats the poetic. One real memory lands harder than three flowery lines.",
      "If long feels wrong, keep it to two sentences and add when you are sending this, Mom. The timing does the tenderness.",
    ],
  },
  {
    slug: "birthday-wishes-for-dad",
    title: "Birthday Wishes for Dad",
    category: "birthday",
    heading: "Birthday wishes for dad",
    intro:
      "Dads collect birthday texts that say happy birthday dad thumbs up. You can do better. Here are lines that sound like you actually know the man.",
    messages: [
      "Happy birthday, Dad. Half my good decisions are just your voice in my head. The other half are not worth discussing.",
      "You taught me how to do things right, even when nobody is watching. Especially then. Happy birthday, Dad.",
      "Happy birthday to the man who fixed it, whatever it was, usually before I finished explaining the problem.",
      "Dad, you are getting older and somehow still the most stubborn person I know. I would not change it. Happy birthday.",
      "Happy birthday, Dad. Every tool I own, every level I check twice, that is you.",
      "For once, do not split the bill. This one is on me. Happy birthday, Dad.",
      "You never said much, but you showed up every single time. Happy birthday to the original.",
      "Happy birthday, Dad. The jokes have not improved in decades and I would not want them to.",
      "Warmest wishes to the guy who drove me everywhere and complained about none of it. Happy birthday, Dad.",
      "Happy birthday, Dad. I will try to call more. Starting today, as a birthday present to you.",
    ],
    longer: [
      "Happy birthday, Dad. We are not a family of long speeches, so I will keep this between us and the card. You built a life out of showing up early, fixing what broke, and never once asking for credit. I noticed. I noticed a lot, actually, and it shaped what I think a decent person looks like. I hope this year brings you slow mornings, good weather, and at least one project that goes exactly to plan. Love you, Dad.",
      "Dad, happy birthday. It took me moving out to understand what you were doing all those years, quietly, in the background. The insurance you renewed, the tires you checked, the way you stood between us and every hard thing you never mentioned. I want a year for you that is all the way yours. No errands for anybody. Happy birthday.",
    ],
    tips: [
      "Men of few words often read cards twice. Say the real thing once, clearly, and let it be.",
      "A joke in the middle makes the sincere ending land twice as hard. Structure, not accident.",
    ],
  },
  {
    slug: "birthday-messages-for-her",
    title: "Birthday Messages for Her",
    category: "birthday",
    heading: "Birthday messages for her",
    intro:
      "For a wife, girlfriend, or the woman who is both the chaos and the calm. Short ones, sweet ones, and a couple that will make her text you back immediately.",
    messages: [
      "Happy birthday to the woman who makes ordinary Tuesdays feel like plot. I love you.",
      "You make my favorite people look average. Happy birthday, gorgeous.",
      "Happy birthday. The world is measurably better with you in it, and today it celebrates properly.",
      "Another year of you, still my favorite notification. Happy birthday.",
      "Happy birthday to the person I want to tell things to first. Always first.",
      "You are a year more wonderful and I am a year more smug about picking you. Happy birthday.",
      "Cake tastes better when it is your cake. Science will eventually confirm this. Happy birthday.",
      "Happy birthday, my love. Here is to slow mornings, loud laughing, and you getting everything you want this year.",
      "The candles are outnumbered by the things I love about you, and candles come in bulk. Happy birthday.",
      "Happy birthday. You keep getting lovelier and I keep having to explain to people that I know, I know how lucky I am.",
    ],
    longer: [
      "Happy birthday, my love. I tried writing something clever and every version came back to the same simple truth: my whole day is built around the parts with you in them. The coffee tastes like nothing until you wander in. The good news is not real until I have told you. Whatever this next year brings, I want to be standing next to you for it, holding your coat and cheering too loudly. You are my favorite person to exist near. Happy birthday.",
    ],
    tips: [
      "If she saves cards, write one line in your own handwriting at the bottom. That is the part she keeps.",
      "A specific detail beats a compliment. The way she laughs at her own jokes before the punchline. That is the gold.",
    ],
  },
  {
    slug: "birthday-messages-for-him",
    title: "Birthday Messages for Him",
    category: "birthday",
    heading: "Birthday messages for him",
    intro:
      "For husbands, boyfriends, brothers, mates. Nothing gushing, nothing corporate. Just lines a real man would read twice.",
    messages: [
      "Happy birthday, mate. Another year of you being right about unimportant things and wrong about the thermostat.",
      "You are the most reliable person I know, except at 7am. Happy birthday.",
      "Happy birthday. May your team win, your grill behave, and your phone stay dry. Amen.",
      "Getting older is mandatory. Getting this many birthday wishes from me is a privilege you have earned. Happy birthday.",
      "Happy birthday to the man who has never once sent a text with a comma. Love you anyway.",
      "You make being around easy, which is rarer than it sounds. Happy birthday.",
      "One year older, still the first person I would call in a crisis or a kebab emergency. Happy birthday.",
      "Happy birthday. The world needs more men like you, mostly so it can relax.",
      "Here is to a year with fewer receipts and more stories. Happy birthday.",
      "Happy birthday to the guy who fixed it without mentioning it. Legend behavior.",
    ],
    longer: [
      "Happy birthday, brother. We do not say the mushy stuff out loud, so it goes in a card where it can be quietly absorbed. You are the one I measure other people against, and they mostly lose. This year, I hope the plan finally works, whatever the plan ends up being. Until then, I have your back, your drink order, and your questionable taste in music memorized. Happy birthday.",
    ],
    tips: [
      "Tease first, warmth second. It reads as honest in that order and as mockery alone in reverse.",
      "If he never replies to messages, a card arrives and he cannot click it away. That is the whole point.",
    ],
  },
  {
    slug: "love-messages-for-her",
    title: "Love Messages for Her",
    category: "love",
    heading: "Love messages for her",
    intro:
      "For no reason, or for every reason, or because she had a long day. Lines that say it without sounding like a greeting card factory wrote them.",
    messages: [
      "I was going to wait for a special occasion, but then I thought, her existing is one.",
      "You are my favorite hello and my hardest goodbye.",
      "Somewhere between the second coffee and the walk home, I fell for you completely. Still falling, by the way.",
      "I love you in the loud places and the quiet ones. The quiet ones more, actually.",
      "If loving you is a habit, it is the one I refuse to break.",
      "You make my life feel like it is well cast.",
      "I keep thinking about you at unhelpful times. Meetings mostly. No regrets.",
      "Home was a place before I met you. Now it is a person, and she is currently on the sofa.",
      "You are the reason my phone battery dies happy.",
      "No news, no reason. Just wanted the next thing you read to be that I love you.",
    ],
    longer: [
      "I love you. I have tried to write something more elegant than that all evening and it keeps winning. So, plainly: you are the thought under all my other thoughts. When anything good happens, the first shape it takes is you. When anything goes wrong, you are the plan. I did not know a person could feel like a direction until you. I love you, today and on every unremarkable day after, which is where the real love lives anyway.",
    ],
    tips: [
      "Send these unprompted. Timing is 80 percent of the romance.",
      "If she asks why now, say no reason. It is both true and devastating.",
    ],
  },
  {
    slug: "love-messages-for-him",
    title: "Love Messages for Him",
    category: "love",
    heading: "Love messages for him",
    intro:
      "Lines for the man in your life, written to be sent without preamble. A few soft, a few funny, all of them short enough to actually get read.",
    messages: [
      "You are my favorite person to do absolutely nothing with.",
      "I still look for you in every room. Old habit, no plans to quit.",
      "You make me laugh at things that are not funny to anyone else, which is the most romantic thing I can think of.",
      "No agenda with this text. I just like you a startling amount.",
      "You are the peace in a loud week. I do not say that enough.",
      "Falling for you was the least complicated thing I have ever done.",
      "You have ruined other men by comparison. My compliments to the chef, meaning you, meaning your whole self.",
      "I love you more than my bed, which if you knew me is a serious claim.",
      "Still choosing you. Every time the question comes up, whenever it comes up.",
      "You, me, bad movie, good snacks. That is the whole dream and you are the whole point of it.",
    ],
    longer: [
      "I do not need a special day to say this, but today it is going in writing so it counts double. I love the way you move through the world. Steady when everything else is not. You have made my life calmer and funnier at the same time, which I did not know was a package deal. Whatever happens next, I want to be there for it, holding your hand and making fun of the same people with you. Forever works for me if it works for you.",
    ],
    tips: [
      "Men rarely get told they are appreciated in specifics. Pick one specific and say it.",
      "A short message in the middle of his day beats a long one at midnight. Catch him off guard.",
    ],
  },
  {
    slug: "good-morning-messages",
    title: "Good Morning Messages",
    category: "morning-night",
    heading: "Good morning messages",
    intro:
      "For early risers, long distances, and people you want to be the first thought of. Short enough to read before the coffee kicks in.",
    messages: [
      "Good morning. The sun is up and so are my opinions about you. They are glowing.",
      "Morning. I hope your coffee is strong and your inbox is short.",
      "Woke up, thought of you, decided to inform you immediately. Good morning.",
      "Good morning to the person already better than my plans for the whole day.",
      "Rise gently. The world can wait ten minutes and so can your phone.",
      "Good morning. Small reminder before the day gets loud: somebody loves you a normal amount, said no one, it is me, it is a huge amount.",
      "The kettle is on somewhere and so is my affection for you. Good morning.",
      "Morning. Sending one warm thought, timed to land before your first meeting.",
      "Good morning. You fell asleep mid sentence last night and I have been smiling about it since 6.",
      "Today's forecast: your name in my head all morning, clearing by never.",
    ],
    longer: [
      "Good morning. Before the notifications take over, one true thing: the day has not decided its mood yet, and you get to nudge it. You have nudged mine more times than you know, usually just by existing nearby. So go be the first kind thing in somebody's morning today. You are already mine.",
    ],
    tips: [
      "Morning messages work because of timing, not poetry. Send before 9am and half the job is done.",
      "Long distance? Morning messages are the relationship. Consistency over brilliance.",
    ],
  },
  {
    slug: "good-night-messages",
    title: "Good Night Messages",
    category: "morning-night",
    heading: "Good night messages",
    intro:
      "For being the last kind thought in someone's head. Soft, short, and certified panda tested for pre sleep delivery.",
    messages: [
      "Good night. The day did its best, and so did you. Rest now.",
      "Sleep well. Tomorrow gets the good version of you, tonight gets the quiet one.",
      "Good night. Putting the whole world down for a minute, except the thought of you, which stays up a little longer.",
      "May your pillow be cold and your worries be tiny. Good night.",
      "Good night. The moon is on shift and has been fully briefed.",
      "You survived the day. That was the assignment. Well done. Good night.",
      "Closing tabs now, including the worries. Good night.",
      "Good night. If you need a lullaby, a panda humming in G is available on request.",
      "Sleep. The problems will still be there tomorrow and you will be stronger tomorrow. Promise kept by morning.",
      "Good night, sweet dreams, and if you dream at all, dream of something soft.",
    ],
    longer: [
      "Good night. Before you close your eyes, one small review of today: you handled more than you gave yourself credit for, and the bits that went wrong were mostly weather, not you. So set it all down. Not just the phone. The whole bag of it. It will keep until morning, and you will carry it lighter after some rest. Sleep well. Someone out here is quietly glad you exist.",
    ],
    tips: [
      "A good-night message after an argument is peace without a formal treaty. Use it.",
      "Do not expect a reply. The point is that it is the last thing read, not the start of a chat.",
    ],
  },
  {
    slug: "i-miss-you-messages",
    title: "I Miss You Messages",
    category: "miss-you",
    heading: "I miss you messages",
    intro:
      "For long distance, old friends, and family far away. Honest ones. The kind that get a reply.",
    messages: [
      "The usual places are fine. They are just not the same without you in them.",
      "I miss you at the boring times, which is how I know it is serious.",
      "Saw something today and reached for my phone to tell you before I remembered the distance. Miss you.",
      "Missing you is a small stone in a shoe. Not painful, exactly. Impossible to ignore.",
      "The city is the same. You are elsewhere. These facts refuse to make peace.",
      "I miss you more than the texts suggest. The texts are being brave.",
      "Come back soon, okay? Everything is 20 percent less funny with you gone.",
      "I would trade every weekend plan for one ordinary Tuesday with you.",
      "Missing someone is just loving them with nowhere to put it. Consider this text somewhere to put it.",
      "It has been too long and I am done pretending I am fine about it. Miss you.",
    ],
    longer: [
      "I miss you. Not the visits and the occasions, though those too. The ordinary parts. The coffee you made wrong on purpose. The way a room changes when you walk into it, like someone opened a window. Distance is patient and I am not. Start planning the trip. I will handle everything on this end, which mostly means waiting badly and telling everyone you are coming.",
    ],
    tips: [
      "Name a specific ordinary moment. Shared small details beat grand statements every time.",
      "If pride is in the way, remember: the worst case is they already miss you and were also being brave.",
    ],
  },
  {
    slug: "thank-you-messages",
    title: "Thank You Messages",
    category: "thanks",
    heading: "Thank you messages",
    intro:
      "For the favors, the support, the showing up. Real gratitude, in sizes from text to letter.",
    messages: [
      "Thank you. Two small words for something that was not small at all.",
      "You showed up before I even finished asking. Thank you for that, and for all the times I never saw.",
      "Thank you for doing the thing nobody asked you to do, and doing it quietly.",
      "Some people help. Some people make it feel like they were waiting for the chance. Thank you for being the second kind.",
      "Thank you. I am still not sure how to repay it, so the plan is to keep trying.",
      "Noticed, remembered, and genuinely appreciated. That is the whole message. Thank you.",
      "You have a habit of arriving exactly when it matters. Thank you for the habit.",
      "Thank you for listening to the whole thing without once checking your phone. Rare gift.",
      "The thank you is overdue and the gratitude is not. Thank you, truly.",
      "Whatever I did to deserve you in my corner, I would like to do it again. Thank you.",
    ],
    longer: [
      "Thank you. I keep composing this in my head at red lights and it never gets less true, so here is the plain version. When things were hard, you did not ask what you could do. You just did it, and made it look like nothing. It was not nothing. It carried me for weeks, and I doubt you know that, which is exactly why I am putting it in writing. People like you are the reason the phrase thank you exists, and still somehow not enough.",
    ],
    tips: [
      "Say exactly what they did. Gratitude without specifics reads as a receipt.",
      "A thank you sent late still lands. Nobody ever minded being thanked twice.",
    ],
  },
  {
    slug: "anniversary-messages",
    title: "Anniversary Messages",
    category: "occasion",
    heading: "Anniversary messages",
    intro:
      "For the years that stacked up quietly. Lines for him, for her, and for the two of you.",
    messages: [
      "Another year of choosing each other, on purpose, again. Happy anniversary.",
      "Some years were loud, some were quiet, and we got through them together. Happy anniversary.",
      "Happy anniversary. Still my favorite decision, and I have made some decent ones.",
      "Years in and I still get a small jump seeing your name on my phone. Happy anniversary.",
      "We made it look easy, but we both know. Happy anniversary, my love.",
      "Happy anniversary to the person who knows all my material and laughs anyway.",
      "One more year of you tolerating my cold feet. Devotion, honestly. Happy anniversary.",
      "Happy anniversary. Here is to the love that got realer and the jokes that got older.",
      "If I had the year to do over, I would still pick the Tuesday I met you. Happy anniversary.",
      "Happy anniversary. The math says years, the days say home.",
    ],
    longer: [
      "Happy anniversary. I have been thinking about what actually holds a year together. It is not the big days, the ones with photos. It is the small ones. The kettle on for two. The bad film neither of us turned off. The silence in the car that only feels comfortable with the right person in it. We have collected hundreds of those days now, and I would not trade the whole album for anything. Here is to the next hundred. I love you.",
    ],
    tips: [
      "Mention one unglamorous moment from the year. The Tuesday, not the trip.",
      "Anniversaries reward effort over expense. A written line beats a booked table, and costs nothing but nerve.",
    ],
  },
  {
    slug: "christmas-card-messages",
    title: "Christmas Card Messages",
    category: "occasion",
    heading: "Christmas card messages",
    intro:
      "Wishes for cards, texts, and little notes tucked under wrapping. Warm ones, funny ones, and some that will make grandma call you personally.",
    messages: [
      "Merry Christmas. May your food be heavy and your worries be light.",
      "Wishing you the kind of Christmas that ends with someone asleep on the sofa, mid sentence.",
      "Merry Christmas to the people who make the rest of the year make sense.",
      "May your Christmas be slow, warm, and entirely free of logistics. Merry Christmas.",
      "Merry Christmas. The wrapping paper is recyclable, the sentiment is not.",
      "One Christmas wish for you: laughter in the kitchen, crumbs everywhere, nobody keeping track.",
      "Merry Christmas from all of us, but mostly from me, enthusiastically.",
      "The best gift this year was the same as last year, the people. Merry Christmas.",
      "Merry Christmas. Somewhere between the food and the mess, I hope you feel properly loved.",
      "Wishing you a Christmas that smells like cinnamon and feels like home. Merry Christmas.",
    ],
    longer: [
      "Merry Christmas. Whatever this season is for you this year, easy or heavy or somewhere in the middle, I hope there is one moment where the noise drops away and it is just warm lights and the sound of people you love arguing about nothing. Those moments are the actual gift. Everything under the tree is packaging. I am grateful you are part of my year, at Christmas and in the ordinary months when nobody is looking. Merry Christmas, truly.",
    ],
    tips: [
      "For family cards, one shared joke makes it a keeper. Store the cards, lose the receipts.",
      "Send one to someone who will be alone this Christmas. That is the whole reason the postal service exists.",
    ],
  },
];

export function getLibraryPage(slug: string): LibraryPage | undefined {
  return LIBRARY.find((p) => p.slug === slug);
}

export function libraryByCategory(cat: string): LibraryPage[] {
  return LIBRARY.filter((p) => p.category === cat);
}

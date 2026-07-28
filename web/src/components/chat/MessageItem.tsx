type MessageRole = 'user' | 'agent';

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
};

const DUMMY_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'agent',
    content:
      'Welcome to Prestige Worldwide support. How may we assist your enterprise today?',
  },
  {
    id: '2',
    role: 'user',
    content: 'Uh… is this the Catalina Wine Mixer hotline?',
  },
  {
    id: '3',
    role: 'agent',
    content:
      'Correct. We are the premier destination for wine, mixing, and unexplained drum solos. Are you Dale or Brennan?',
  },
  {
    id: '4',
    role: 'user',
    content:
      'Brennan. Dale says we need boats. And also hoes. For the company.',
  },
  {
    id: '5',
    role: 'agent',
    content:
      'Ah yes — the classic “Boats ’N Hoes” expansion package. Includes one yacht fantasy, zero actual boats, and at least one sibling argument.',
  },
  {
    id: '6',
    role: 'user',
    content:
      'Can we get the package where we sleep in bunk beds but still run a global media empire?',
  },
  {
    id: '7',
    role: 'agent',
    content:
      'That’s our “Dreams” tier. Comes with matching pajamas, a treehouse pitch deck, and a stern talk from Nancy and Robert.',
  },
  {
    id: '8',
    role: 'user',
    content:
      'Robert keeps saying I need a job. Dale says we already have one: entertainment.',
  },
  {
    id: '9',
    role: 'agent',
    content:
      'Entertainment is a valid vertical. Have you considered debuting at the Catalina Wine Mixer with a surprise musical number?',
  },
  {
    id: '10',
    role: 'user',
    content:
      'Dale already wrote the lyrics. It’s mostly about boats. And also hoes. Repeatedly.',
  },
  {
    id: '11',
    role: 'agent',
    content:
      'Perfect branding. Prestige Worldwide thrives on repetition, confidence, and ignoring every adult in the room.',
  },
  {
    id: '12',
    role: 'user',
    content: 'What if Derek tries to sabotage us again? He’s so competitive.',
  },
  {
    id: '13',
    role: 'agent',
    content:
      'Standard response: accuse him of never liking you, threaten bunk-bed divorce, then win the crowd with heartfelt nonsense.',
  },
  {
    id: '14',
    role: 'user',
    content: 'Dale also wants a helicopter landing during the chorus.',
  },
  {
    id: '15',
    role: 'agent',
    content:
      'Approved. Helicopters photograph well next to wine. Please sign the waiver titled “We Are Not Responsible for Your Imagination.”',
  },
  {
    id: '16',
    role: 'user',
    content: 'Can we expense matching shark costumes?',
  },
  {
    id: '17',
    role: 'agent',
    content:
      'Only if they further the brand. Prestige Worldwide: sharks, wine, bunk beds, emotional damage, and yacht metaphors.',
  },
  {
    id: '18',
    role: 'user',
    content:
      'Dale just yelled “Catalina Wine Mixer!” into a sock puppet. Is that billable?',
  },
  {
    id: '19',
    role: 'agent',
    content:
      'Highly billable. Sock-puppet strategy sessions are a cornerstone of our creative process.',
  },
  {
    id: '20',
    role: 'user',
    content:
      'Okay last question — do you guys do birthday parties? Dale turns… whatever age he is.',
  },
  {
    id: '21',
    role: 'agent',
    content:
      'We do. Package includes cake, conflict, a drum fill, and someone shouting “This is the Catalina Wine Mixer!” at an inappropriate volume.',
  },
  {
    id: '22',
    role: 'user',
    content:
      'Sold. Book Prestige Worldwide for the mixer. Dale says “Boats ’N Hoes” is non-negotiable.',
  },
  {
    id: '23',
    role: 'agent',
    content:
      'Booked. Bring the energy, leave the maturity at home, and remember: we’re not just a company — we’re a lifestyle of questionable decisions.',
  },
];

export function MessageItem() {
  return (
    <div className='flex flex-col gap-2.5 px-3 py-4'>
      {DUMMY_MESSAGES.map((message) => {
        const isUser = message.role === 'user';

        return (
          <article
            key={message.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                isUser
                  ? 'rounded-br-sm bg-black text-white '
                  : 'max-w-full mb-6 text-slate-900'
              }`}
            >
              {message.content}
            </div>
          </article>
        );
      })}
    </div>
  );
}

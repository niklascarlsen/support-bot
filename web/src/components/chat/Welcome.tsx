export function Welcome({
  welcomeMessage,
  iceBreakers,
  onPick,
}: {
  welcomeMessage: string;
  iceBreakers: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className='welcome-in flex flex-col gap-3 px-5 pt-4'>
      <p className='text-sm leading-relaxed text-slate-900'>{welcomeMessage}</p>
      {iceBreakers.length > 0 && (
        <ul className='flex flex-col items-start gap-2'>
          {iceBreakers.map((text) => (
            <li key={text}>
              <button
                type='button'
                onClick={() => onPick(text)}
                className='rounded-xs border border-black/20 px-3 py-1.5 text-sm text-slate-900 hover:border-black'
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import {Diamond} from '@/icons/Diamond';
import {MessageRow} from './MessageRow';

export function Welcome({
  welcomeMessage,
  iceBreakers,
  onPick,
  animate = false,
}: {
  welcomeMessage: string;
  iceBreakers: string[];
  onPick: (text: string) => void;
  animate?: boolean;
}) {
  return (
    <div className={`px-5 pt-4 pb-4${animate ? ' welcome-in' : ''}`}>
      <MessageRow icon={Diamond}>
        <div className='flex flex-col gap-3'>
          <p className='text-slate-900'>{welcomeMessage}</p>
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
      </MessageRow>
    </div>
  );
}

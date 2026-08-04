import {WIDGET_CONFIG} from '@/lib/config';
import {Wrapper} from '@/components/chat/Chat';

export default function Page() {
  return (
    <div className='min-h-[200vh] bg-white'>
      <Wrapper config={WIDGET_CONFIG} />
    </div>
  );
}

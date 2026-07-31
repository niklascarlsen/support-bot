import {useEffect, useState} from 'react';

const API_URL = import.meta.env.VITE_WIDGET_API_URL ?? '/api/widget';

type WidgetConfig = {
  welcomeMessage: string;
  iceBreakers: string[];
};

export function useWidgetConfig(): WidgetConfig | null {
  const [config, setConfig] = useState<WidgetConfig | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((response) =>
        response.ok ? (response.json() as Promise<WidgetConfig>) : null,
      )
      .then(setConfig)
      .catch(() => {});
  }, []);

  return config;
}

import { useEffect } from 'react';
import BmCastApp from './bmcast/App';
import { themeService } from './bmcast/services/themeService';

export default function App() {
  useEffect(() => {
    themeService.applyTheme(themeService.getTheme());
  }, []);

  return <BmCastApp />;
}

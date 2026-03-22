import { useState } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { ProgressProvider } from './context/ProgressContext';
import { PremiumProvider } from './context/PremiumContext';
import HomeScreen from './pages/HomeScreen';
import MemoryGameScreen from './pages/MemoryGameScreen';
import FocusGameScreen from './pages/FocusGameScreen';
import NumbersGameScreen from './pages/NumbersGameScreen';
import SpatialGameScreen from './pages/SpatialGameScreen';
import WordMemoryScreen from './pages/WordMemoryScreen';
import PremiumScreen from './pages/PremiumScreen';

export default function App() {
  const [screen, setScreen] = useState('home');

  return (
    <LanguageProvider>
      <ProgressProvider>
        <PremiumProvider>
          {screen === 'home'       && <HomeScreen        onNavigate={setScreen} />}
          {screen === 'memory'     && <MemoryGameScreen  onNavigate={setScreen} />}
          {screen === 'focus'      && <FocusGameScreen   onNavigate={setScreen} />}
          {screen === 'numbers'    && <NumbersGameScreen onNavigate={setScreen} />}
          {screen === 'spatial'    && <SpatialGameScreen onNavigate={setScreen} />}
          {screen === 'wordMemory' && <WordMemoryScreen  onNavigate={setScreen} />}
          {screen === 'premium'    && <PremiumScreen     onNavigate={setScreen} />}
        </PremiumProvider>
      </ProgressProvider>
    </LanguageProvider>
  );
}

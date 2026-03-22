import { useState, useEffect } from 'react';
import { preloadSounds } from './utils/sound';
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
import GamesScreen from './pages/GamesScreen';
import StatsScreen from './pages/StatsScreen';
import MindWellnessScreen from './pages/MindWellnessScreen';
import AchievementsScreen from './pages/AchievementsScreen';

export default function App() {
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    preloadSounds();
  }, []);

  return (
    <LanguageProvider>
      <ProgressProvider>
        <PremiumProvider>
          {screen === 'home'       && <HomeScreen        onNavigate={setScreen} activeNav="home" />}
          {screen === 'games'      && <GamesScreen       onNavigate={setScreen} activeNav="games" />}
          {screen === 'stats'      && <StatsScreen       onNavigate={setScreen} activeNav="stats" />}
          {screen === 'achievements' && <AchievementsScreen onNavigate={setScreen} activeNav="achievements" />}
          {screen === 'premium'    && <PremiumScreen     onNavigate={setScreen} activeNav="premium" />}
          {screen === 'wellness'   && <MindWellnessScreen onNavigate={setScreen} activeNav="wellness" />}
          {screen === 'memory'     && <MemoryGameScreen  onNavigate={setScreen} />}
          {screen === 'focus'      && <FocusGameScreen   onNavigate={setScreen} />}
          {screen === 'numbers'    && <NumbersGameScreen onNavigate={setScreen} />}
          {screen === 'spatial'    && <SpatialGameScreen onNavigate={setScreen} />}
          {screen === 'wordMemory' && <WordMemoryScreen  onNavigate={setScreen} />}
        </PremiumProvider>
      </ProgressProvider>
    </LanguageProvider>
  );
}

import { useState } from "react";
import { GameCard } from "@/components/GameCard";
import { AnagramSolver } from "@/components/AnagramSolver";
import { WordHuntSolver } from "@/components/WordHuntSolver";

type GameMode = "menu" | "anagram" | "wordhunt";

const Index = () => {
  const [currentMode, setCurrentMode] = useState<GameMode>("menu");

  const renderContent = () => {
    switch (currentMode) {
      case "anagram":
        return <AnagramSolver onBack={() => setCurrentMode("menu")} />;
      case "wordhunt":
        return <WordHuntSolver onBack={() => setCurrentMode("menu")} />;
      default:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4 animate-float">
              <h1 className="text-5xl font-bold text-foreground tracking-tight">
                Game Pigeon
                <span className="game-gradient bg-clip-text text-transparent"> Solver</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Solve word games with ease. Choose your game type below to get started.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <GameCard
                title="Anagram Solver"
                description="Find all possible words from a set of letters"
                icon="🔤"
                onClick={() => setCurrentMode("anagram")}
              />
              <GameCard
                title="Word Hunt Solver"
                description="Discover hidden words in a 4x4 letter grid"
                icon="🎯"
                onClick={() => setCurrentMode("wordhunt")}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;

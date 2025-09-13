import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shuffle, Search } from "lucide-react";
import { fetchAnagrams } from "@/lib/api";

// Game Pigeon 6-letter scoring
const POINTS: Record<number, number> = {
  3: 100,
  4: 400,
  5: 1200,
  6: 2000,
};

interface AnagramSolverProps {
  onBack: () => void;
}

export const AnagramSolver = ({ onBack }: AnagramSolverProps) => {
  const [letters, setLetters] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const getWordScore = (word: string): number => POINTS[word.length] ?? 0;

  const findAnagrams = async () => {
    const raw = letters.trim();
    if (!raw) return;

    setIsLoading(true);
    setErr(null);

    try {
      const clean = raw.toLowerCase().replace(/[^a-z]/g, "");
      const maxLen = Math.min(6, clean.length); // cap at 6 for standard game

      const out = await fetchAnagrams(clean, 3, maxLen);

      // Sort by score desc, then alphabetically
      out.sort((a, b) => getWordScore(b) - getWordScore(a) || a.localeCompare(b));

      setFoundWords(out);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to fetch anagrams");
      setFoundWords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const displayLetters = letters.toLowerCase().replace(/[^a-z]/g, "");
  const totalPoints = foundWords.reduce((sum, w) => sum + getWordScore(w), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Anagram Solver</h1>
          <p className="text-muted-foreground">Enter your letters to find all possible words</p>
        </div>
      </div>

      <Card className="card-gradient border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-game-primary" />
            Enter Letters
          </CardTitle>
          <CardDescription>
            Type the letters you have available (spaces and special characters will be ignored)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., gamepigeon"
              value={letters}
              onChange={(e) => setLetters(e.target.value)}
              className="flex-1 text-lg"
              onKeyDown={(e) => e.key === "Enter" && findAnagrams()}
            />
            <Button
              variant="solver"
              onClick={findAnagrams}
              disabled={!letters.trim() || isLoading}
              className="px-6"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {letters && (
            <div className="text-sm text-muted-foreground">
              Available letters: <span className="font-mono text-foreground">{displayLetters}</span>
            </div>
          )}

          {err && <div className="text-sm text-red-500">{err}</div>}
        </CardContent>
      </Card>

      {foundWords.length > 0 && (
        <Card className="card-gradient border-border/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Found Words ({foundWords.length})</span>
              <Badge variant="secondary">{totalPoints} points</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {foundWords.map((word, index) => (
                <div
                  key={index}
                  className="bg-secondary/50 border border-border/20 rounded-lg p-3 text-center hover:bg-secondary/70 transition-colors"
                >
                  <div className="font-mono text-sm font-semibold text-foreground">{word.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">{getWordScore(word)} pts</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {foundWords.length === 0 && letters && !isLoading && !err && (
        <Card className="card-gradient border-border/20">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No words found with those letters. Try different combinations!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Grid3X3, Search, Settings } from "lucide-react";
import { filterDictionary } from "@/lib/api";

interface WordHuntSolverProps {
  onBack: () => void;
}

type Path = number[][];

export const WordHuntSolver = ({ onBack }: WordHuntSolverProps) => {
  const [gridSize, setGridSize] = useState(4);
  const [grid, setGrid] = useState<string[][]>(Array(4).fill(null).map(() => Array(4).fill("")));
  const [foundWords, setFoundWords] = useState<{ word: string; path: Path }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<{row: number, col: number} | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // --- scoring (keep your existing approach) ---
  const getWordScore = (word: string): number => {
    const basePoints = word.length;
    if (word.length >= 6) return basePoints + 3;
    if (word.length >= 5) return basePoints + 2;
    if (word.length >= 4) return basePoints + 1;
    return basePoints;
  };

  const updateGridCell = (row: number, col: number, value: string) => {
    const newGrid = [...grid];
    newGrid[row][col] = value.toLowerCase().slice(0, 1);
    setGrid(newGrid);

    // Auto-focus next cell
    if (value && value.trim() !== "") {
      let nextRow = row;
      let nextCol = col + 1;
      if (nextCol >= gridSize) { nextRow = row + 1; nextCol = 0; }
      if (nextRow < gridSize) {
        setTimeout(() => {
          const nextInput = inputRefs.current[nextRow]?.[nextCol];
          if (nextInput) { nextInput.focus(); setCurrentFocus({row: nextRow, col: nextCol}); }
        }, 50);
      }
    }
  };

  const updateGridSize = (newSize: number) => {
    setGridSize(newSize);
    const newGrid = Array(newSize).fill(null).map(() => Array(newSize).fill(""));
    setGrid(newGrid);
    setFoundWords([]);
    inputRefs.current = Array(newSize).fill(null).map(() => Array(newSize).fill(null));
  };

  useEffect(() => {
    inputRefs.current = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  }, [gridSize]);

  const isValidPosition = (row: number, col: number): boolean =>
    row >= 0 && row < gridSize && col >= 0 && col < gridSize;

  const findWordsInGrid = async () => {
    setIsLoading(true);
    try {
      // Collect all candidate words (>=3 letters), track a single path for each word
      const candidatesSet = new Set<string>();
      const pathForWord = new Map<string, Path>();
      const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));

      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [ 0, -1],          [ 0, 1],
        [ 1, -1], [ 1, 0], [ 1, 1],
      ];

      const MAX_LEN = 8; // stop runaway; adjust if you want longer words

      const dfs = (row: number, col: number, currentWord: string, path: Path) => {
        const nextWord = currentWord + grid[row][col];
        const nextPath = [...path, [row, col]];

        if (nextWord.length >= 3) {
          if (!candidatesSet.has(nextWord)) {
            candidatesSet.add(nextWord);
            pathForWord.set(nextWord, nextPath);
          }
        }
        if (nextWord.length >= MAX_LEN) return;

        for (const [dr, dc] of directions) {
          const nr = row + dr, nc = col + dc;
          if (isValidPosition(nr, nc) && !visited[nr][nc] && grid[nr][nc]) {
            visited[nr][nc] = true;
            dfs(nr, nc, nextWord, nextPath);
            visited[nr][nc] = false;
          }
        }
      };

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (grid[i][j]) {
            visited[i][j] = true;
            dfs(i, j, "", []);
            visited[i][j] = false;
          }
        }
      }

      const candidates = Array.from(candidatesSet);

      // Ask the server (backed by dictionary.txt) to filter real words
      const validWords = await filterDictionary(candidates);

      // Build result list with paths
      const results = validWords.map(w => ({ word: w, path: pathForWord.get(w)! }));

      // Remove dupes defensively, sort by length desc
      const unique = results.filter((item, idx, arr) =>
        arr.findIndex(o => o.word === item.word) === idx
      );
      unique.sort((a, b) => b.word.length - a.word.length);

      setFoundWords(unique);
    } catch (e) {
      console.error(e);
      setFoundWords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isGridComplete = (): boolean => grid.every(row => row.every(cell => cell !== ""));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Word Hunt Solver</h1>
          <p className="text-muted-foreground">Enter your grid to find all hidden words</p>
        </div>
      </div>

      <Card className="card-gradient border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-game-primary" />
            Enter Grid
          </CardTitle>
          <CardDescription>Fill each cell with a single letter</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Grid Size:</span>
            </div>
            <Select value={gridSize.toString()} onValueChange={(v) => updateGridSize(parseInt(v))}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3×3</SelectItem>
                <SelectItem value="4">4×4</SelectItem>
                <SelectItem value="5">5×5</SelectItem>
                <SelectItem value="6">6×6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className="grid gap-2 mx-auto"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, maxWidth: `${gridSize * 4}rem` }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <Input
                  key={`${r}-${c}`}
                  ref={(el) => {
                    if (!inputRefs.current[r]) inputRefs.current[r] = [];
                    inputRefs.current[r][c] = el;
                  }}
                  value={cell}
                  onChange={(e) => updateGridCell(r, c, e.target.value)}
                  onFocus={() => setCurrentFocus({ row: r, col: c })}
                  className="w-16 h-16 text-center text-xl font-bold uppercase bg-input border-border focus:border-primary focus:ring-primary/20"
                  maxLength={1}
                />
              ))
            )}
          </div>

          <div className="flex justify-center">
            <Button
              variant="solver"
              onClick={findWordsInGrid}
              disabled={!isGridComplete() || isLoading}
              className="px-8"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isLoading ? "Solving..." : "Find Words"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {foundWords.length > 0 && (
        <Card className="card-gradient border-border/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Found Words ({foundWords.length})</span>
              <Badge variant="secondary">
                {foundWords.reduce((s, it) => s + getWordScore(it.word), 0)} points
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {foundWords.map((item, index) => (
                <div key={index} className="bg-secondary/70 border border-border/30 rounded-lg p-3 hover:bg-secondary/90 transition-colors">
                  <div className="font-mono text-lg font-semibold text-foreground text-center">
                    {item.word.toUpperCase()}
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {getWordScore(item.word)} pts
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {item.word.length} letters
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {foundWords.length === 0 && isGridComplete() && !isLoading && (
        <Card className="card-gradient border-border/20">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No words found in this grid. Double-check your letters!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

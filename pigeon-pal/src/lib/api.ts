// for anagrams
export async function fetchAnagrams(input: string, min = 3, max?: number) {
  const url = new URL('/api/anagrams', window.location.origin);
  url.searchParams.set('input', input);
  url.searchParams.set('min', String(min));
  if (max) url.searchParams.set('max', String(max));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: { words: string[] } = await res.json();
  return data.words;
}
// for wordhunt
export async function filterDictionary(candidates: string[]): Promise<string[]> {
  const res = await fetch("/api/filter", {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=UTF-8" },
    body: candidates.join("\n"),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: { valid: string[] } = await res.json();
  return data.valid;
}

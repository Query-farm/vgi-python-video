import React, { createContext, useContext } from "react";

// Frame (relative to the scene's start) at which each narration cue's word
// begins. Scenes read beats from here so animation lands on the voice.
const CueContext = createContext<Record<string, number>>({});

export const CueProvider: React.FC<{ cues: Record<string, number>; children: React.ReactNode }> = ({ cues, children }) => (
  <CueContext.Provider value={cues}>{children}</CueContext.Provider>
);

/** Frame of the named cue; `fallback` is used when there is no voice-over. */
export const useCue = (name: string, fallback: number): number => {
  const cues = useContext(CueContext);
  return cues[name] ?? fallback;
};

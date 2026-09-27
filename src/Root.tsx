import React from "react";
import { Composition, Still } from "remotion";
import { Thumbnail } from "./Thumbnail";
import { ScenePlayer, VgiExplainer } from "./Video";
import { SCENES, TOTAL_FRAMES } from "./timeline";
import { FPS, WIDTH, HEIGHT } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="VgiExplainer" component={VgiExplainer} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
    <Still id="ReadmeThumbnail" component={() => <Thumbnail play duration={`${Math.floor(TOTAL_FRAMES / FPS / 60)}:${String(Math.round(TOTAL_FRAMES / FPS) % 60).padStart(2, "0")}`} />} width={1280} height={720} />
    {/* Each scene on its own (with its voice and effects), for iterating in the studio. */}
    {SCENES.map((s) => (
      <Composition
        key={s.id}
        id={`scene-${s.id}`}
        component={() => <ScenePlayer scene={s} />}
        durationInFrames={s.frames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
  </>
);

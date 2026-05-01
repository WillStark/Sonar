import "./index.css";
import { Composition } from "remotion";
import { SonarPromo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SonarPromo"
        component={SonarPromo}
        durationInFrames={570}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

import {
  AbsoluteFill,
  Easing,
  Series,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const SPONSORS = [
  { name: "Apify", role: "Sourcing across LinkedIn / Crunchbase / Google" },
  { name: "Nebius", role: "Lender-fit scoring + outreach drafting (Llama-3.x)" },
  { name: "KugelAudio", role: "Per-lead voice memo synthesis" },
];

const ENTER = Easing.bezier(0.16, 1, 0.3, 1);
const EXIT = Easing.bezier(0.7, 0, 0.84, 0);
const POP = Easing.bezier(0.34, 1.56, 0.64, 1);

const Background = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = interpolate(frame, [0, 22 * fps], [0, 60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill className="bg-slate-950">
      <div
        className="absolute -inset-40 opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(34,211,238,0.18) 0%, rgba(2,6,23,0) 60%)",
          transform: `translate3d(${-drift / 4}px, ${-drift / 6}px, 0)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.45) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          transform: `translate3d(${drift / 8}px, ${drift / 10}px, 0)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Pulse: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delay;
  const cycle = 2 * fps;
  const t = ((local % cycle) + cycle) % cycle;
  const scale = interpolate(t, [0, cycle], [0.2, 2.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity =
    local < 0
      ? 0
      : interpolate(t, [0, cycle * 0.8, cycle], [0.85, 0.0, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div
      className="absolute left-1/2 top-1/2 h-[420px] w-[420px] rounded-full border-2 border-cyan-400"
      style={{
        transform: `translate3d(-50%, -50%, 0) scale(${scale})`,
        opacity,
        boxShadow: "0 0 80px rgba(34,211,238,0.35)",
      }}
    />
  );
};

const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordmarkOpacity = interpolate(frame, [0.6 * fps, 1.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });
  const wordmarkY = interpolate(frame, [0.6 * fps, 1.6 * fps], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });
  const exit = interpolate(frame, [2.5 * fps, 3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXIT,
  });

  return (
    <AbsoluteFill
      className="items-center justify-center"
      style={{ opacity: 1 - exit }}
    >
      <Pulse delay={0} />
      <Pulse delay={0.4 * fps} />
      <Pulse delay={0.8 * fps} />
      <Pulse delay={1.2 * fps} />
      <div
        className="flex flex-col items-center gap-4"
        style={{
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.9)]" />
        <div className="text-[160px] font-black tracking-tight text-white leading-none">
          Sonar
        </div>
        <div className="text-2xl font-medium tracking-[0.4em] text-cyan-300 uppercase">
          voice-native gtm
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Typewriter: React.FC<{
  text: string;
  startFrame: number;
  cps: number;
}> = ({ text, startFrame, cps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const charsShown = Math.max(
    0,
    Math.min(text.length, Math.floor(((frame - startFrame) / fps) * cps)),
  );
  const visible = text.slice(0, charsShown);
  const showCursor = Math.floor(frame / (0.5 * fps)) % 2 === 0;
  return (
    <span>
      {visible}
      <span
        className="inline-block bg-cyan-300 align-baseline ml-1"
        style={{
          width: "0.08em",
          height: "0.85em",
          opacity: showCursor ? 1 : 0.1,
        }}
      />
    </span>
  );
};

const SceneTagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lineOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });
  const exit = interpolate(frame, [4.5 * fps, 5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXIT,
  });
  return (
    <AbsoluteFill
      className="items-center justify-center px-32"
      style={{ opacity: (1 - exit) * lineOpacity }}
    >
      <div className="max-w-[1500px] text-center">
        <div className="mb-10 text-xl font-semibold uppercase tracking-[0.6em] text-cyan-300/80">
          The pitch
        </div>
        <div className="text-[88px] font-bold leading-tight text-white">
          <Typewriter
            text="Voice-native GTM."
            startFrame={0.4 * fps}
            cps={22}
          />
        </div>
        <div className="mt-8 text-[64px] font-medium leading-tight text-slate-300">
          <Typewriter
            text="Find the next lender customers — and call them."
            startFrame={1.6 * fps}
            cps={28}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SponsorCard: React.FC<{
  index: number;
  name: string;
  role: string;
}> = ({ index, name, role }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 0.3 * fps + index * 0.35 * fps;
  const enter = interpolate(frame, [delay, delay + 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });
  const y = interpolate(enter, [0, 1], [60, 0]);
  return (
    <div
      className="flex w-[1100px] items-center gap-8 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-8 backdrop-blur"
      style={{
        opacity: enter,
        transform: `translateY(${y}px)`,
        boxShadow: "0 30px 80px rgba(8,47,73,0.45)",
      }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-cyan-500/10 text-3xl font-black text-cyan-300">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="flex flex-col">
        <div className="text-[56px] font-bold leading-none text-white">
          {name}
        </div>
        <div className="mt-3 text-[24px] font-medium text-slate-300">{role}</div>
      </div>
    </div>
  );
};

const SceneStack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerEnter = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });
  const exit = interpolate(frame, [5.5 * fps, 6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXIT,
  });
  return (
    <AbsoluteFill
      className="items-center justify-center"
      style={{ opacity: 1 - exit }}
    >
      <div
        className="mb-12 text-center"
        style={{
          opacity: headerEnter,
          transform: `translateY(${interpolate(headerEnter, [0, 1], [12, 0])}px)`,
        }}
      >
        <div className="text-xl font-semibold uppercase tracking-[0.6em] text-cyan-300/80">
          The stack
        </div>
        <div className="mt-4 text-[64px] font-bold text-white">
          Three sponsor APIs, stacked.
        </div>
      </div>
      <div className="flex flex-col items-center gap-5">
        {SPONSORS.map((s, i) => (
          <SponsorCard key={s.name} index={i} name={s.name} role={s.role} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const PipelineDot: React.FC<{
  delay: number;
  label: string;
  hue: string;
}> = ({ delay, label, hue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = interpolate(frame, [delay, delay + 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: POP,
  });
  return (
    <div
      className="flex flex-col items-center"
      style={{
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
      }}
    >
      <div
        className="h-16 w-16 rounded-full"
        style={{
          background: hue,
          boxShadow: `0 0 32px ${hue}`,
        }}
      />
      <div className="mt-4 text-[22px] font-semibold text-slate-200">{label}</div>
    </div>
  );
};

const PipelineConnector: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fill = interpolate(frame, [delay, delay + 0.45 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });
  return (
    <div className="relative h-1 w-32 overflow-hidden rounded-full bg-slate-700">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-sky-400"
        style={{ width: `${fill * 100}%` }}
      />
    </div>
  );
};

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerEnter = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });
  const wordmark = interpolate(frame, [3.6 * fps, 4.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER,
  });

  return (
    <AbsoluteFill className="items-center justify-center">
      <div
        className="mb-16 text-center"
        style={{
          opacity: headerEnter,
          transform: `translateY(${interpolate(headerEnter, [0, 1], [12, 0])}px)`,
        }}
      >
        <div className="text-xl font-semibold uppercase tracking-[0.6em] text-cyan-300/80">
          Send signal
        </div>
        <div className="mt-4 text-[56px] font-bold text-white">
          Signal in. Voice memo out.
        </div>
      </div>

      <div className="flex items-center gap-6">
        <PipelineDot delay={0.3 * fps} label="Signal" hue="rgba(34,211,238,0.9)" />
        <PipelineConnector delay={0.7 * fps} />
        <PipelineDot delay={1.1 * fps} label="Score" hue="rgba(56,189,248,0.9)" />
        <PipelineConnector delay={1.5 * fps} />
        <PipelineDot delay={1.9 * fps} label="Draft" hue="rgba(125,211,252,0.9)" />
        <PipelineConnector delay={2.3 * fps} />
        <PipelineDot delay={2.7 * fps} label="Voice" hue="rgba(165,243,252,0.9)" />
      </div>

      <div
        className="mt-24 flex flex-col items-center gap-3"
        style={{
          opacity: wordmark,
          transform: `translateY(${interpolate(wordmark, [0, 1], [12, 0])}px)`,
        }}
      >
        <div className="text-[120px] font-black leading-none tracking-tight text-white">
          Sonar
        </div>
        <div className="text-[22px] font-medium tracking-[0.4em] uppercase text-slate-400">
          Powered by Apify · Nebius · KugelAudio
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SonarPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={90} layout="none">
          <SceneIntro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150} layout="none">
          <SceneTagline />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180} layout="none">
          <SceneStack />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150} layout="none">
          <SceneOutro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

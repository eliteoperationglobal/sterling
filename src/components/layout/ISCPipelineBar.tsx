"use client";

interface Stage {
  id: string;
  label: string;
  count: number;
}

interface Props {
  stages: Stage[];
  activeStage: string;
  onChange: (id: string) => void;
}

export default function ISCPipelineBar({
  stages,
  activeStage,
  onChange,
}: Props) {
  return (
    <div className="bg-white border-b">
      <div className="flex flex-wrap items-center gap-6 px-6 py-4 text-[13px] text-gray-400">
        {stages.map((stage, index) => {
          const active = stage.id === activeStage;

          return (
            <div
              key={stage.id}
              onClick={() => onChange(stage.id)}
              className={`flex items-center gap-2 cursor-pointer select-none relative ${active
                ? "text-black font-medium"
                : "hover:text-gray-700"
                }`}
            >
              {/* LEFT DOT ICON */}
              <span
                className={`w-2 h-2 rounded-full ${active ? "bg-black" : "bg-gray-300"
                  }`}
              ></span>

              <span>{stage.label}</span>

              {/* COUNT BADGE */}
              <span
                className={`px-2 py-[1px] rounded-md text-[11px] border ${active
                  ? "border-black text-black"
                  : "border-gray-300 text-gray-400"
                  }`}
              >
                {stage.count}
              </span>

              {/* ARROW */}
              {index < stages.length - 1 && (
                <span className="text-gray-300 ml-2">{">"}</span>
              )}

              {/* ACTIVE UNDERLINE */}
              {active && (
                <span className="absolute -bottom-3 left-0 w-full h-[2px] bg-black"></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

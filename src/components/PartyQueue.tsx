import React from "react";
import type { PartyQueueItem } from "../lib/queue";

interface PartyQueueProps {
  queue: PartyQueueItem[];
}

export default function PartyQueue({ queue }: PartyQueueProps) {
  const visibleQueue = queue.slice(0, 3);

  const [animationKey, setAnimationKey] = React.useState(0);
  const previousQueueRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    const currentIds = visibleQueue.map((track) => track.track_uri);

    const previousIds = previousQueueRef.current;

    if (
      previousIds.length > 0 &&
      currentIds.join("|") !== previousIds.join("|")
    ) {
      setAnimationKey((value) => value + 1);
    }

    previousQueueRef.current = currentIds;
  }, [queue]);

  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        marginTop: "4px",
      }}
    >
      {/* Queue Card */}
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#202020",
          borderRadius: "10px",
          padding: "12px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: "20px",
            display: "flex",
            alignItems: "center",
            fontSize: "14px",
            fontWeight: 700,
            lineHeight: "20px",
            color: "#ffffff",
            marginBottom: "10px",
          }}
        >
          Next in queue
        </div>

        {/* Queue */}
        <div
          key={animationKey}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            animation:
              animationKey > 0
                ? "partyQueueRefresh 360ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
          }}
        >
          {visibleQueue.map((track) => (
            <div
              key={track.track_uri}
              style={{
                width: "100%",
                height: "48px",
                minHeight: "48px",
                paddingLeft: "2px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {/* Artwork */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  minWidth: "40px",
                  borderRadius: "3px",
                  overflow: "hidden",
                  background: "#333333",
                  flexShrink: 0,
                }}
              >
                {track.artwork_url ? (
                  <img
                    src={track.artwork_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : null}
              </div>

              {/* Track information */}
              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                  height: "40px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {/* Title */}
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#ffffff",
                    lineHeight: "17px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {track.track_name}
                </div>

                {/* Artist */}
                <div
                  style={{
                    marginTop: "1px",
                    fontSize: "11px",
                    color: "#a7a7a7",
                    lineHeight: "15px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {track.artist_name ?? "Unknown artist"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Animation */}
      <style>
        {`
          @keyframes partyQueueRefresh {
            0% {
              opacity: 0.65;
              transform: translateY(10px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

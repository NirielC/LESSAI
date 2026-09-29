import React, { memo } from 'react';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { StyleSheet } from 'react-native';
import { colors } from '../config/theme';
import { POSE_CONNECTIONS, HAND_CONNECTIONS } from './MockLandmarkSource';

/**
 * Dibuja el esqueleto sobre el video. Es puramente presentacional: recibe un
 * LandmarkFrame y no le importa de donde salio (mock o MediaPipe).
 */
function LandmarkOverlayBase({ frame, width, height, visible = true }) {
  if (!visible || !frame || !width || !height) return null;

  const px = (lm) => ({ x: lm.x * width, y: lm.y * height });
  const isVisible = (lm) => lm && (lm.visibility ?? 1) > 0.4;

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      {/* --- Malla facial --- */}
      <G opacity={0.75}>
        {frame.face?.map((lm, i) => {
          const p = px(lm);
          return <Circle key={`f${i}`} cx={p.x} cy={p.y} r={1.6} fill={colors.landmarkFace} />;
        })}
      </G>

      {/* --- Huesos del cuerpo --- */}
      <G>
        {POSE_CONNECTIONS.map(([a, b], i) => {
          const la = frame.pose?.[a];
          const lb = frame.pose?.[b];
          if (!isVisible(la) || !isVisible(lb)) return null;
          const pa = px(la);
          const pb = px(lb);
          return (
            <Line
              key={`pc${i}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={colors.landmarkBone}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}
      </G>

      {/* --- Articulaciones del cuerpo --- */}
      <G>
        {frame.pose?.map((lm, i) =>
          isVisible(lm) ? (
            <Circle key={`p${i}`} cx={px(lm).x} cy={px(lm).y} r={4} fill={colors.landmarkPose} />
          ) : null
        )}
      </G>

      {/* --- Manos --- */}
      {[frame.leftHand, frame.rightHand].map((hand, handIndex) =>
        hand ? (
          <G key={`h${handIndex}`}>
            {HAND_CONNECTIONS.map(([a, b], i) => {
              const pa = px(hand[a]);
              const pb = px(hand[b]);
              return (
                <Line
                  key={`hc${handIndex}${i}`}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={colors.landmarkBone}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              );
            })}
            {hand.map((lm, i) => {
              const p = px(lm);
              return (
                <Circle
                  key={`hp${handIndex}${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={i === 0 ? 4.5 : 3.2}
                  fill={colors.landmarkHand}
                />
              );
            })}
          </G>
        ) : null
      )}
    </Svg>
  );
}

/** Memo: el overlay se redibuja ~15 veces por segundo, no debe arrastrar a la pantalla. */
export const LandmarkOverlay = memo(LandmarkOverlayBase);
export default LandmarkOverlay;

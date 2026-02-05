/**
 * Generates two new timer alert sounds as WAV files:
 * - pulse.wav: Three rapid beeps at 880Hz (staccato rhythm)
 * - alert.wav: Two-tone ascending alert (660Hz -> 880Hz)
 *
 * Run: node scripts/generate-sounds.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOUNDS_DIR = path.join(__dirname, '..', 'assets', 'sounds');

const SAMPLE_RATE = 44100;
const BIT_DEPTH = 16;
const NUM_CHANNELS = 1;

function generateTone(frequency, durationMs, sampleRate = SAMPLE_RATE, fadeMs = 5) {
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const fadeSamples = Math.floor((fadeMs / 1000) * sampleRate);
  const samples = new Float64Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    let amplitude = Math.sin(2 * Math.PI * frequency * i / sampleRate);

    // Fade in
    if (i < fadeSamples) {
      amplitude *= i / fadeSamples;
    }
    // Fade out
    if (i > numSamples - fadeSamples) {
      amplitude *= (numSamples - i) / fadeSamples;
    }

    samples[i] = amplitude * 0.8; // 80% volume to avoid clipping
  }

  return samples;
}

function generateSilence(durationMs, sampleRate = SAMPLE_RATE) {
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  return new Float64Array(numSamples);
}

function concatenateSamples(...arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Float64Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function samplesToWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const bytesPerSample = BIT_DEPTH / 8;
  const dataSize = samples.length * bytesPerSample;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * NUM_CHANNELS * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(NUM_CHANNELS * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(BIT_DEPTH, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM samples
  const maxVal = Math.pow(2, BIT_DEPTH - 1) - 1;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const intVal = Math.round(clamped * maxVal);
    buffer.writeInt16LE(intVal, headerSize + i * bytesPerSample);
  }

  return buffer;
}

// Pulse: Three rapid beeps at 880Hz, 80ms each, 60ms gaps
function generatePulse() {
  const beep = generateTone(880, 80);
  const gap = generateSilence(60);

  return concatenateSamples(beep, gap, beep, gap, beep);
}

// Alert: Ascending two-tone, 660Hz for 150ms, 50ms gap, 880Hz for 200ms
function generateAlert() {
  const tone1 = generateTone(660, 150);
  const gap = generateSilence(50);
  const tone2 = generateTone(880, 200);

  return concatenateSamples(tone1, gap, tone2);
}

// Generate and write files
const pulseBuffer = samplesToWavBuffer(generatePulse());
const alertBuffer = samplesToWavBuffer(generateAlert());

fs.writeFileSync(path.join(SOUNDS_DIR, 'pulse.wav'), pulseBuffer);
fs.writeFileSync(path.join(SOUNDS_DIR, 'alert.wav'), alertBuffer);

console.log('Generated:');
console.log(`  pulse.wav (${pulseBuffer.length} bytes)`);
console.log(`  alert.wav (${alertBuffer.length} bytes)`);

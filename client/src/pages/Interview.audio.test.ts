import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Audio Playback - No Overlap", () => {
  let audioRef: HTMLAudioElement | null = null;
  let audioUrl: string | null = null;

  beforeEach(() => {
    // Setup mock audio
    audioRef = null;
    audioUrl = "blob:http://localhost/test-audio";
    
    // Mock Audio constructor
    global.Audio = vi.fn(function(src: string) {
      this.src = src;
      this.currentTime = 0;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
    }) as any;
  });

  it("should stop previous playback before starting new playback", () => {
    const playRecording = () => {
      if (audioUrl) {
        // Stop any existing playback
        if (audioRef) {
          audioRef.pause();
          audioRef.currentTime = 0;
        }
        
        // Create new audio element if needed
        if (!audioRef) {
          audioRef = new Audio(audioUrl);
        } else {
          audioRef.src = audioUrl;
        }
        
        // Play from beginning
        audioRef.currentTime = 0;
        audioRef.play();
      }
    };

    // First play
    playRecording();
    expect(audioRef).not.toBeNull();
    expect(audioRef?.play).toHaveBeenCalled();

    // Second play - should pause first
    const pauseSpy = vi.spyOn(audioRef!, "pause");
    playRecording();
    expect(pauseSpy).toHaveBeenCalled();
    expect(audioRef?.currentTime).toBe(0);
  });

  it("should reset currentTime to 0 on each play", () => {
    const playRecording = () => {
      if (audioUrl) {
        if (audioRef) {
          audioRef.pause();
          audioRef.currentTime = 0;
        }
        
        if (!audioRef) {
          audioRef = new Audio(audioUrl);
        } else {
          audioRef.src = audioUrl;
        }
        
        audioRef.currentTime = 0;
        audioRef.play();
      }
    };

    // Play multiple times
    playRecording();
    audioRef!.currentTime = 5; // Simulate playback at 5 seconds
    
    playRecording();
    expect(audioRef?.currentTime).toBe(0);
  });

  it("should not create multiple audio elements", () => {
    const playRecording = () => {
      if (audioUrl) {
        if (audioRef) {
          audioRef.pause();
          audioRef.currentTime = 0;
        }
        
        if (!audioRef) {
          audioRef = new Audio(audioUrl);
        } else {
          audioRef.src = audioUrl;
        }
        
        audioRef.currentTime = 0;
        audioRef.play();
      }
    };

    const firstAudioRef = audioRef;
    playRecording();
    const secondAudioRef = audioRef;
    
    playRecording();
    const thirdAudioRef = audioRef;

    // Should reuse same audio element
    expect(secondAudioRef).toBe(firstAudioRef);
    expect(thirdAudioRef).toBe(firstAudioRef);
  });
});

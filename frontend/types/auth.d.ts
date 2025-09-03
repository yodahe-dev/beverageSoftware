export interface LoginResponse {
  token: string;
  refreshToken?: string;
}

export interface ResetResponse {
  resetToken: string;
}

export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}
